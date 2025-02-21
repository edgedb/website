import { Configuration, OpenAIApi } from "openai";
import { createHash } from "crypto";
import dotenv from "dotenv";
import { promises as fs } from "fs";
import { inspect } from "util";
import { join } from "path";
import getTokensLen from "./getTokensLen";
import * as edgedb from "edgedb";
import e from "docs/dbschema/edgeql-js";

dotenv.config();
dotenv.config({ path: ".env.local" });

interface Section {
  id?: string;
  path: string;
  tokens: number;
  checksum: string;
  content: string;
  embedding: number[];
}

type WalkEntry = {
  path: string;
};

async function walk(dir: string): Promise<WalkEntry[]> {
  const immediateFiles = await fs.readdir(dir);

  const recursiveFiles: { path: string }[][] = await Promise.all(
    immediateFiles.map(async (file: any) => {
      const path = join(dir, file);
      const stats = await fs.stat(path);
      if (stats.isDirectory()) return walk(path);
      else if (stats.isFile()) return [{ path }];
      else return [];
    })
  );

  const flattenedFiles: { path: string }[] = recursiveFiles.reduce(
    (all, folderContents) => all.concat(folderContents),
    []
  );

  return flattenedFiles.sort((a, b) => a.path.localeCompare(b.path));
}

class EmbeddingSource {
  checksum?: string;
  content?: string;
  path: string;

  constructor(public filePath: string) {
    this.path = filePath.replace(/^.build-cache\/gpt\//, "");
  }

  async load() {
    const content = await fs.readFile(this.filePath, "utf8");
    const checksum = createHash("sha256").update(content).digest("base64");

    this.checksum = checksum;
    this.content = content;

    return {
      checksum,
      content,
    };
  }
}

// --refresh: Regenerate all embeddings, otherwise just new changes.
async function generateEmbeddings() {
  // Don't run the script for preview builds, only for prod
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV != "production") return;

  const args = process.argv.slice(2);
  const shouldRefresh = args.includes("--refresh");

  if (!process.env.OPENAI_KEY) {
    return console.log(
      "Environment variable OPENAI_KEY is required: skipping embeddings generation."
    );
  }

  if (!process.env.EDGEDB_INSTANCE || !process.env.EDGEDB_SECRET_KEY) {
    return console.log(
      "Environment variables EDGEDB_INSTANCE and EDGEDB_SECRET_KEY are required: skipping embeddings generation."
    );
  }

  const configuration = new Configuration({
    organization: process.env.ORGANIZATION_ID,
    apiKey: process.env.OPENAI_KEY,
  });

  const openai = new OpenAIApi(configuration);

  const client = edgedb.createClient();

  const embeddingSources: EmbeddingSource[] = [
    ...(await walk(".build-cache/gpt")).map(
      (entry) => new EmbeddingSource(entry.path)
    ),
  ];

  console.log(`Discovered ${embeddingSources.length} pages`);

  if (shouldRefresh) {
    try {
      console.log("Refresh flag set, re-generating all pages.");

      await client.ensureConnected();

      // Delete old data from the DB.
      await e
        .delete(e.Section, (section) => ({
          filter: e.op(section.tokens, ">=", 0),
        }))
        .run(client);
      const contents: string[] = [];
      const sections: Section[] = [];

      for (const embeddingSource of embeddingSources) {
        const { path } = embeddingSource;
        const { checksum, content } = await embeddingSource.load();
        // OpenAI recommends replacing newlines with spaces for best results (specific to embeddings)
        const contentTrimmed = content.replace(/\n/g, " ");
        contents.push(contentTrimmed);
        sections.push({ path, checksum, content, tokens: 0, embedding: [] });
      }

      const tokens = await getTokensLen(contents);

      // We get error if we try to get embeddings for all sections at once, so we'll create few chunks and make few calls to the OpenAI
      const contentChunks: string[][] = [];
      const chunkSize = 500;

      for (let i = 0; i < contents.length; i += chunkSize) {
        const chunk = contents.slice(i, i + chunkSize);
        contentChunks.push(chunk);
      }

      for (let i = 0; i < contentChunks.length; i++) {
        const embeddingResponse = await openai.createEmbedding({
          model: "text-embedding-ada-002",
          input: contentChunks[i],
        });

        if (embeddingResponse.status !== 200) {
          throw new Error(inspect(embeddingResponse.data, false, 2));
        }

        embeddingResponse.data.data.forEach((item, j) => {
          sections[i * chunkSize + j].embedding = item.embedding;
          sections[i * chunkSize + j].tokens = tokens[i * chunkSize + j];
        });
      }

      const query = e.params({ sections: e.json }, ({ sections }) => {
        return e.for(e.json_array_unpack(sections), (section) => {
          return e.insert(e.Section, {
            path: e.cast(e.str, section.path),
            content: e.cast(e.str, section.content),
            checksum: e.cast(e.str, section.checksum),
            tokens: e.cast(e.int16, section.tokens),
            embedding: e.cast(e.OpenAIEmbedding, section.embedding),
          });
        });
      });

      const sectionChunkSize = 100;
      let i = 0;

      while (i * sectionChunkSize <= sections.length) {
        await query.run(client, {
          sections: sections.slice(
            i * sectionChunkSize,
            (i + 1) * sectionChunkSize
          ),
        });
        i++;
      }
    } catch (err) {
      console.error("Error while trying to regenerate all embeddings.", err);
    }
  } else {
    try {
      console.log("Checking which pages are new or have changed.");

      await client.ensureConnected();

      const query = e.select(e.Section, () => ({
        path: true,
        checksum: true,
      }));

      const existingSections = await query.run(client);

      const updatedSections: Section[] = [];
      const newSections: Section[] = [];

      for (const embeddingSource of embeddingSources) {
        const { path } = embeddingSource;

        const { checksum, content } = await embeddingSource.load();

        // Check for existing section in DB and compare checksums
        const existingSection = existingSections.filter(
          (section) => section.path == path
        )[0];

        if (existingSection?.checksum === checksum) continue;

        const input = content.replace(/\n/g, " ");

        const embeddingResponse = await openai.createEmbedding({
          model: "text-embedding-ada-002",
          input,
        });

        if (embeddingResponse.status !== 200) {
          throw new Error(inspect(embeddingResponse.data, false, 2));
        }

        const [responseData] = embeddingResponse.data.data;

        const tokens = (await getTokensLen([input]))[0];

        if (existingSection) {
          updatedSections.push({
            path,
            content,
            checksum,
            tokens,
            embedding: responseData.embedding,
          });
        } else {
          newSections.push({
            path,
            content,
            checksum,
            tokens,
            embedding: responseData.embedding,
          });
        }
      }

      if (updatedSections.length) {
        console.log(
          "Update sections at paths",
          updatedSections.map((section) => section.path)
        );
        const query = e.params(
          {
            sections: e.array(
              e.tuple({
                path: e.str,
                content: e.str,
                checksum: e.str,
                tokens: e.int16,
                embedding: e.OpenAIEmbedding,
              })
            ),
          },
          ({ sections }) => {
            return e.for(e.array_unpack(sections), (section) => {
              return e.update(e.Section, () => ({
                filter_single: { path: section.path },
                set: {
                  content: section.content,
                  checksum: section.checksum,
                  tokens: section.tokens,
                  embedding: section.embedding,
                },
              }));
            });
          }
        );

        // if (updatedSections.length) {
        //   console.log(
        //     "Update sections at paths",
        //     updatedSections.map((section) => section.path)
        //   );
        //   const query = e.params({sections: e.json}, (params) => {
        //     return e.for(e.json_array_unpack(params.sections), (section) => {
        //       return e.update(e.Section, () => ({
        //         filter_single: {path: e.cast(e.str, section.path)},
        //         set: {
        //           content: e.cast(e.str, section.content),
        //           checksum: e.cast(e.str, section.checksum),
        //           tokens: e.cast(e.int16, section.tokens),
        //           embedding: e.cast(e.OpenAIEmbedding, section.embedding),
        //         },
        //       }));
        //     });
        //   });

        await query.run(client, {
          sections: updatedSections,
        });
      }
      // Insert new sections.
      if (newSections.length) {
        console.log(
          "Insert new section at paths",
          newSections.map((section) => section.path)
        );
        const query = e.params({ sections: e.json }, ({ sections }) => {
          return e.for(e.json_array_unpack(sections), (section) => {
            return e.insert(e.Section, {
              path: e.cast(e.str, section.path),
              content: e.cast(e.str, section.content),
              checksum: e.cast(e.str, section.checksum),
              tokens: e.cast(e.int16, section.tokens),
              embedding: e.cast(e.OpenAIEmbedding, section.embedding),
            });
          });
        });

        await query.run(client, {
          sections: newSections,
        });
      }

      // If some sections are deleted in docs delete them from db too
      const deletedSectionsPaths: string[] = [];

      for (const existingSection of existingSections) {
        const docsSection = embeddingSources.filter(
          (section) => section.path == existingSection.path
        )[0];

        if (!docsSection) deletedSectionsPaths.push(existingSection.path);
      }

      if (deletedSectionsPaths.length) {
        console.log("Delete sections at paths", deletedSectionsPaths);

        const query = e.params({ paths: e.array(e.str) }, ({ paths }) =>
          e.delete(e.Section)
        );

        await query.run(client, { paths: deletedSectionsPaths });

        // await client.execute(
        //   `
        //   with raw_data := <array<str>>$paths,
        //   delete (select Section
        //     filter .path in array_unpack(raw_data))
        //   `,
        //   {paths: deletedSectionsPaths}
        // );
      }
    } catch (err) {
      console.error("Error while trying to update embeddings.", err);
    }
  }

  console.log("Embedding generation complete");
}

async function main() {
  await generateEmbeddings();
}

main().catch((err) =>
  console.error("Error has ocurred while generating embeddings.", err)
);
