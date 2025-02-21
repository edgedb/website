import path from "path";
import process from "process";
import fs from "fs";
import yaml from "js-yaml";
import z from "zod";

import {sortByName, sortByDate} from "@edgedb-site/shared/utils/sorting";

const teamMember = z
  .object({
    name: z.string(),
    role: z.string(),
    country: z.string(),
    avatar: z.string(),
    github: z.string().url(),
    linkedin: z.string().url(),
    twitter: z.string().url(),
  })
  .partial({
    avatar: true,
    github: true,
    linkedin: true,
    twitter: true,
  });

const article = z.object({
  platform: z.string(),
  type: z.string(),
  date: z
    .string()
    .regex(/\d{4}\/\d{2}\/\d{2}/, "Expected date in YYYY/MM/DD format"),
  desc: z.string(),
  link: z.string().url(),
});

const team = z.array(teamMember);
const media = z.array(article);

export async function loadAboutPageData() {
  const contentDir = path.resolve(
    path.join(process.cwd(), "content", "about")
  );

  const teamFilePath = path.join(contentDir, "team.yaml");
  const mediaFilePath = path.join(contentDir, "media.yaml");

  let teamFile = fs.readFileSync(teamFilePath, "utf8");
  let mediaFile = fs.readFileSync(mediaFilePath, "utf8");

  return {
    team: sortByName(team.parse(yaml.load(teamFile))),
    media: sortByDate(media.parse(yaml.load(mediaFile))),
  };
}
