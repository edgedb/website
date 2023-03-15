import * as fs from "fs";
import * as path from "path";
import {promisify} from "util";

import matter from "gray-matter";
import * as z from "zod";
import remark from "remark";
import remarkHtml from "remark-html";

import {PromiseType} from "@/utils/typing";

import {pick} from "../utils";

const readDirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);

const careersDir = "content/careers";

const jobPositionSchema = z.object({
  id: z.string(),
  title: z.string(),
  location: z.string(),
  keywords: z.string(),
  weight: z.number(),
  active: z.boolean(),
});

const remarkProcessor = remark().use(remarkHtml);

const processMarkdown = (markdown: string) =>
  remarkProcessor.process(markdown).then((result) => result.toString());

async function getPositionsData() {
  const files = await readDirAsync(careersDir);

  const mdFiles = files.filter((file) => /\.md$/.test(file));

  const positions = await Promise.all(
    mdFiles.map(async (filename) => {
      const filePath = path.join(careersDir, filename);
      const fileContent = await readFileAsync(filePath, "utf8");

      const {content, data} = matter(fileContent);

      let frontmatter: z.infer<typeof jobPositionSchema>;
      try {
        frontmatter = jobPositionSchema.parse(data);
      } catch (e) {
        throw new Error(
          `'${filePath}' contains invalid frontmatter: ${(e as Error).message}`
        );
      }

      return {
        frontmatter: {
          ...frontmatter,
          id: frontmatter.id.toLowerCase(),
          keywords: frontmatter.keywords.split(", "),
        },
        content,
      };
    })
  );

  return positions
    .filter((position) => position.frontmatter.active)
    .sort((a, b) => b.frontmatter.weight - a.frontmatter.weight);
}

export async function getAllPositions() {
  return await (await getPositionsData()).map((position) => ({
    ...pick(position.frontmatter, ["id", "title", "location"]),
  }));
}

export type PositionsList = PromiseType<ReturnType<typeof getAllPositions>>;

export async function getPosition(id: string) {
  const positions = await getPositionsData();

  const position = positions.find((pos) => pos.frontmatter.id === id);

  if (!position) {
    throw new Error(`Job position not found with id: ${id}`);
  }

  return {
    ...pick(position.frontmatter, ["title", "location"]),
    content: await processMarkdown(position.content),
    id,
  };
}

export type Position = PromiseType<ReturnType<typeof getPosition>>;
