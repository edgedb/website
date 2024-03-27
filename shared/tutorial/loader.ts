import * as crypto from "crypto";
import * as path from "path";
import * as process from "process";
import { promises as fs } from "fs";
import * as fss from "fs";
import { z } from "zod";
import * as yaml from "js-yaml";
import { marked } from "marked";

import { Logger } from "@edgedb-site/build-tools/logger";
import { getCacheItem, setCacheItem } from "@edgedb-site/build-tools/caching";
import { PromisePool } from "@edgedb-site/build-tools/promisePool";
import { schemaQuery } from "@edgedb/schema-graph/state/query";
import { markdownToRawText } from "@edgedb-site/build-tools/searchUtils";

import { getEdgeDBServerURL } from "./srvloc";

import {
  SectionValidator,
  TutorialStaticData,
  TutorialStaticPageData,
  CellResultsAPIValidator,
  EvaledResultData,
  ParsedMarkdown,
  CellsValidator,
  TutorialNavData,
} from "./types";

import { decode } from "./binproto";
import { fetchWithTimeout } from "./utils";

marked.use({ headerIds: false, mangle: false });

function parseMarkdown(markdown: string): ParsedMarkdown {
  const tokens = marked.lexer(markdown);

  function parseToken(token: marked.Token) {
    return marked(token.raw.replace(/^\s|\s$/g, " "), {}).slice(3, -5);
  }

  return tokens.map((_token) => {
    const token = _token as Exclude<marked.Token, marked.Tokens.Def>;

    if (token.type === "paragraph") {
      const blocks: (string | { html: string; href: string })[] = [""];
      for (const childToken of (token as any).tokens ?? []) {
        if (childToken.type === "link") {
          blocks.push({
            html: marked.parser(childToken.tokens).slice(3, -5),
            href: childToken.href,
          });
        } else {
          const html = parseToken(childToken);
          if (typeof blocks[blocks.length - 1] === "string") {
            blocks[blocks.length - 1] += html;
          } else {
            blocks.push(html);
          }
        }
      }
      return blocks;
    } else {
      return parseToken(token);
    }
  });
}

function hashData(data: string[]) {
  const hash = crypto.createHash("sha256");
  hash.update(data.join("\u0000"));
  return hash.digest("hex");
}

async function attemptReadJSONFile(filepath: string) {
  try {
    return JSON.parse(await fs.readFile(filepath, "utf8"));
  } catch {
    return null;
  }
}

const dbFetchPool = new PromisePool(10);
const serverUrl = getEdgeDBServerURL();

export function databaseFetch(queries: string[]) {
  return dbFetchPool.run(async () => {
    const res = await fetchWithTimeout(serverUrl, {
      method: "POST",
      mode: "cors",
      body: JSON.stringify({ queries }),
      timeout: 20 * 1000,
    });
    return {
      data: await res.json(),
      protocolVersion: res.headers
        .get("edgedb-protocol-version")
        ?.split(".")
        .map((n) => parseInt(n, 10)) as [number, number] | undefined,
    };
  });
}

function decodeResultData(
  data: EvaledResultData,
  protocolVersion?: [number, number]
) {
  if (data.kind !== "data") {
    throw new Error("result has no data");
  }

  return decode(
    ...(data.data.slice(0, 3) as [string, string, string]),
    protocolVersion
  )[0];
}

export async function getTutorialPages() {
  const contentDir = path.resolve(
    path.join(process.cwd(), "content", "tutorial", "pages")
  );

  const files = await fs.readdir(contentDir);
  files.sort((a, b) => (a > b ? 1 : -1));

  const pagesContent = await Promise.all(
    files.map((fn) => fs.readFile(path.join(contentDir, fn), "utf8"))
  );

  const navData: TutorialNavData = {};
  const pageData: TutorialStaticPageData = {};

  for (const content of pagesContent) {
    const data = yaml.load(content);
    const section = SectionValidator.parse(data);

    navData[section.slug] = { title: section.title, categories: {} };

    for (const cat of section.categories) {
      navData[section.slug].categories[cat.slug] = {
        title: cat.category,
        pages: {},
      };

      for (const page of cat.pages) {
        navData[section.slug].categories[cat.slug].pages[page.slug] =
          page.title;

        const pagePath = `${section.slug}/${cat.slug}/${page.slug}`;

        if (pageData[pagePath]) {
          throw new Error(`duplicate page: ${pagePath}`);
        }

        let relname = pagePath;
        const refs: string[] = [page.ref ?? relname.replace(/-|\//g, "_")];

        if (page === cat.pages[0]) {
          relname = `${section.slug}/${cat.slug}`;
          if (!page.ref) {
            refs.push(relname.replace(/-|\//g, "_"));
          }

          if (cat === section.categories[0]) {
            if (!page.ref) {
              refs.push(section.slug.replace(/-|\//g, "_"));
            }

            if (content === pagesContent[0]) {
              relname = "";
            }
          }
        }

        pageData[pagePath] = {
          relname,
          refs,
          slug: page.slug,
          title: page.title,
          cells: page.cells,
        };
      }
    }
  }

  return { pageData, navData };
}

export async function load(logger: Logger = console) {
  const cacheDir = path.resolve(".build-cache/tutorial");

  const tutorialDataFile = path.join(cacheDir, "edb-tutorial.json");
  const schemaTextFile = path.join(cacheDir, "schema-text.json");
  const schemaDataFile = path.join(cacheDir, "schema-data.json");

  const schemaFile = path.join(
    process.cwd(),
    "content",
    "tutorial",
    "dbschema",
    "schema.esdl"
  );

  fss.mkdirSync(cacheDir, { recursive: true });

  const [
    { pageData, navData },
    { data: dbStateData, protocolVersion },
  ] = await Promise.all([
    getTutorialPages(),
    databaseFetch([
      "select sys::get_version_as_str()",
      "describe schema as sdl",
    ]),
  ]);

  const dbState = CellResultsAPIValidator.parse(dbStateData);
  if (
    dbState.kind === "error" ||
    dbState.results.some((res) => res.kind !== "data")
  ) {
    throw new Error("Failed to query latest db state");
  }

  let dbStateHash: string;
  try {
    dbStateHash = hashData(
      dbState.results.map((res) =>
        decodeResultData(res, protocolVersion)[0].toString()
      )
    );
  } catch {
    throw new Error("Failed to query latest db state");
  }

  const cacheKey = `tutorial-${dbStateHash}-resultdata`;
  const cachedData: { [pageHash: string]: any } | null = JSON.parse(
    (await getCacheItem(cacheKey)) ?? "null"
  );
  const updatedCacheData: { [pageHash: string]: any } = {};
  let cacheUpdated = false;

  const prefetchedResults: TutorialStaticData["prefetchedResults"] = {};

  const rawContent = new Map<string, string>();

  await Promise.all(
    Object.entries(pageData).map(async ([pagePath, { cells }]) => {
      let queries: string[] = [];
      let rawText = "";
      let expectErrors: boolean[] = [];
      for (const cell of cells) {
        switch (cell.kind) {
          case "text":
            rawText += markdownToRawText(cell.text);

            cell.text = parseMarkdown(cell.text) as any;
            break;
          case "edgeql":
            queries.push(cell.text);
            expectErrors.push(!!cell.expectError);
            break;
        }
      }
      rawContent.set(pagePath, rawText);

      if (!queries.length) {
        return;
      }

      const pageHash = hashData([...queries, ...expectErrors.map(String)]);

      if (cachedData?.[pageHash]) {
        prefetchedResults[pagePath] = cachedData[pageHash];
        updatedCacheData[pageHash] = cachedData[pageHash];
        return;
      }

      logger.log(`Evaluating ${pagePath} ... `);
      const response = (await databaseFetch(queries)).data;

      const cellsResults = CellResultsAPIValidator.parse(response);
      if (cellsResults.kind === "error") {
        throw new Error(
          `Error during pre-evaluating ${pagePath}: ` +
            `${cellsResults.error.message}`
        );
      }

      for (let i = 0; i < cellsResults.results.length; i++) {
        const res = cellsResults.results[i];
        const expectError = expectErrors[i];

        if ((res.kind === "error") !== expectError) {
          throw new Error(
            `Error processing code cell ${
              i + 1
            } in ${pagePath}: result is of kind '${res.kind}' but kind ${
              expectError ? `'error'` : `'data' or 'skipped'`
            } was expected. Error: ${JSON.stringify((res as any).error)}`
          );
        }

        if (res.kind === "data") {
          decode(res.data[0], res.data[1], res.data[2], protocolVersion);
        }
      }

      prefetchedResults[pagePath] = cellsResults.results;
      updatedCacheData[pageHash] = cellsResults.results;
      cacheUpdated = true;
    })
  );

  if (cacheUpdated) {
    setCacheItem(cacheKey, JSON.stringify(updatedCacheData));
  }

  const cachedSchemaData = await getCacheItem(
    `tutorial-${dbStateHash}-schemaData`
  );
  let schemaData;
  if (cachedSchemaData) {
    schemaData = JSON.parse(cachedSchemaData);
  } else {
    schemaData = await fetchSchemaData(logger);
    setCacheItem(
      `tutorial-${dbStateHash}-schemaData`,
      JSON.stringify(schemaData)
    );
  }
  setCacheItem(`tutorial-latest-schemaData`, JSON.stringify(schemaData));

  const schemaFileContent = await fs
    .readFile(schemaFile, { encoding: "utf8" })
    .then((text) =>
      text
        .trim()
        .replace(/^using extension notebook.*?\r?\n/i, "")
        .trim()
    );

  setCacheItem(`tutorial-latest-schemaText`, JSON.stringify(schemaFileContent));

  const tutorialData: TutorialStaticData = {
    pages: pageData,
    prefetchedResults,
    protocolVersion: protocolVersion ?? null,
  };

  await Promise.all([
    fs.writeFile(tutorialDataFile, JSON.stringify(tutorialData)),
    fs.writeFile(schemaTextFile, JSON.stringify(schemaFileContent)),
    fs.writeFile(schemaDataFile, JSON.stringify(schemaData)),
  ]);

  logger.log("Done!");

  return { tutorialData, rawContent, navData };
}

async function fetchSchemaData(logger: Logger = console) {
  const queries = [schemaQuery];

  logger.log(`Fetching schema data ... `);
  const { data, protocolVersion } = await databaseFetch(queries);

  const results = CellResultsAPIValidator.parse(data);

  if (results.kind === "results") {
    const schemaData = results.results.map((res) => {
      if (res.kind !== "data") {
        throw new Error("Expected result of 'data' kind");
      }
      decode(res.data[0], res.data[1], res.data[2], protocolVersion);
      return res.data;
    });

    return {
      data: (schemaData as unknown) as [string, string, string],
      protocolVersion,
    };
  }
  throw new Error("Failed to fetch schema data");
}
