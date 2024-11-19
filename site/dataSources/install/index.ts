import * as fs from "fs";
import * as path from "path";
import {promisify} from "util";

import matter from "gray-matter";
import * as z from "zod";
import {remark} from "remark";
import remarkHtml from "remark-html";

import {PromiseType} from "@edgedb-site/shared/utils/typing";

const readDirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);

const installInstructionsDir = "content/download";

const installInstructionMetaSchema = z.object({
  os: z.string(),
  kind: z.string(),
  version: z.string().optional(),
  weight: z.number().optional(),
});

type InstallInstructionContent = {
  type: "html" | "code";
  text: string;
}[];

export interface InstallInstruction {
  slug: string;
  kind: string;
  weight?: number;
  content: InstallInstructionContent;
}

const remarkProcessor = remark().use(remarkHtml);

const processMarkdown = (markdown: string) =>
  remarkProcessor.process(markdown).then((result) => result.toString());

export async function getInstallInstructionsData() {
  const files = await readDirAsync(installInstructionsDir);

  const mdFiles = files.filter((file) => /\.md$/.test(file));

  const installInstructions = await Promise.all(
    mdFiles.map(async (filename) => {
      const filePath = path.join(installInstructionsDir, filename);
      const fileContent = await readFileAsync(filePath, "utf8");

      const {content: rawContent, data} = matter(fileContent);

      let frontmatter: z.infer<typeof installInstructionMetaSchema>;
      try {
        frontmatter = installInstructionMetaSchema.parse(data);
      } catch (e) {
        throw new Error(
          `'${filePath}' contains invalid frontmatter: ${(e as Error).message}`
        );
      }

      const content = (await processMarkdown(rawContent))
        .split(/<pre><code>|<\/code><\/pre>/)
        .reduce((data, chunk, i) => {
          const isCode = i % 2 !== 0;
          data.push({
            type: isCode ? "code" : "html",
            text: isCode
              ? chunk.replace(/&#x([0-9a-fA-F]+);/g, (_, codePoint) =>
                  String.fromCodePoint(parseInt(codePoint, 16))
                )
              : chunk,
          });
          return data;
        }, [] as InstallInstructionContent);

      return {
        frontmatter,
        content,
      };
    })
  );

  const grouped = installInstructions.reduce(
    (oses, {frontmatter, content}) => {
      if (!oses[frontmatter.os]) {
        oses[frontmatter.os] = [];
      }
      const kind =
        frontmatter.kind.trim() +
        (frontmatter.version?.trim() ? " " + frontmatter.version.trim() : "");
      oses[frontmatter.os].push({
        slug: `${frontmatter.os
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")}-${kind
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")}`,
        kind,
        weight: frontmatter.weight,
        content,
      });
      return oses;
    },
    {} as {
      [os: string]: InstallInstruction[];
    }
  );

  for (const [os, group] of Object.entries(grouped)) {
    grouped[os] = group
      .sort((a, b) => (b.weight ?? -1) - (a.weight ?? -1))
      .map(({slug, kind, content}) => ({slug, kind, content}));
  }

  return grouped;
}

export type InstallInstructionsData = PromiseType<
  ReturnType<typeof getInstallInstructionsData>
>;
