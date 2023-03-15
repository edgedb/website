import * as crypto from "crypto";
import * as path from "path";
import * as process from "process";
import {promises as fs} from "fs";
import * as fss from "fs";
import * as https from "https";

import fetch from "node-fetch";
import * as yaml from "js-yaml";
import marked from "marked";

import {Logger} from "@edgedb/site-build-tools/logger";
import {schemaQuery} from "@edgedb/schema-graph/state/query";

import {getEdgeDBServerURL} from "./srvloc";

import {
  SectionValidator,
  TutorialStaticData,
  TutorialSectionStaticData,
  CellResultsAPIValidator,
  EvaledResultData,
  ParsedMarkdown,
} from "./types";

import {decode} from "./binproto";
import {unescapeHtmlEntities} from "../dataBuild/utils";

const markedPlainRenderers = {
  ...[
    "code",
    "blockquote",
    "html",
    "heading",
    "hr",
    "list",
    "listitem",
    "checkbox",
    "table",
    "tablerow",
    "tablecell",
    "strong",
    "em",
    "codespan",
    "del",
    "text",
  ].reduce((renderers, type) => {
    renderers[type] = (text: any) => (typeof text === "string" ? text : "");

    return renderers;
  }, {} as any),
  paragraph: (text: string) => text + " ",
  br: () => "\n",
  link: (_: any, __: any, text: string) => text,
  image: (_: any, __: any, text: string) => text,
};

function parseMarkdown(markdown: string): ParsedMarkdown {
  const tokens = marked.lexer(markdown);

  function parseToken(token: marked.Token) {
    return marked(token.raw.replace(/^\s|\s$/g, " "), {}).slice(3, -5);
  }

  return tokens.map((_token) => {
    const token = _token as Exclude<marked.Token, marked.Tokens.Def>;

    if (token.type === "paragraph") {
      const blocks: (string | {html: string; href: string})[] = [""];
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

interface CachedPageData {
  migrationId: string;
  data: Record<string, {hash: string; results: EvaledResultData[]}>;
  schemaData?: {
    data: [string, string, string];
    protocolVersion?: [number, number];
  };
}

function hashPageData(data: string[]) {
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

const httpsAgent = new https.Agent({rejectUnauthorized: false});

export async function databaseFetch(queries: string[]) {
  const serverUrl = getEdgeDBServerURL();
  const res = await fetch(serverUrl, {
    method: "POST",
    // @ts-ignore
    mode: "cors",
    body: JSON.stringify({queries}),
    timeout: 20 * 1000,
    agent: serverUrl.startsWith("https://localhost") ? httpsAgent : undefined,
  });
  return {
    data: await res.json(),
    protocolVersion: res.headers
      .get("edgedb-protocol-version")
      ?.split(".")
      .map((n) => parseInt(n, 10)) as [number, number] | undefined,
  };
}

export async function load(logger: Logger = console) {
  const contentDir = path.resolve(
    path.join(process.cwd(), "content", "tutorial", "pages")
  );
  const cacheDir = path.resolve(".build-cache/tutorial");

  const tutorialDataFile = path.join(cacheDir, "edb-tutorial.json");
  const cacheFile = path.join(cacheDir, "cached-data.json");
  const schemaTextFile = path.join(cacheDir, "schema-text.json");
  const schemaDataFile = path.join(cacheDir, "schema-data.json");

  const schemaFile = path.join(
    process.cwd(),
    "content",
    "tutorial",
    "dbschema",
    "schema.esdl"
  );

  fss.mkdirSync(cacheDir, {recursive: true});

  const sections: TutorialSectionStaticData[] = [];

  const files = await fs.readdir(contentDir);
  files.sort((a, b) => (a > b ? 1 : -1));

  const pages: string[] = await Promise.all(
    files.map((fn) => fs.readFile(path.join(contentDir, fn), "utf8"))
  );

  const {data: migrationData, protocolVersion} = await databaseFetch([
    `SELECT (
      SELECT schema::Migration {
        children := .<parents[IS schema::Migration]
      } FILTER NOT EXISTS .children
    ).id;`,
  ]);

  const migrationResult = CellResultsAPIValidator.parse(migrationData);

  if (
    migrationResult.kind === "error" ||
    migrationResult.results[0].kind !== "data"
  ) {
    throw new Error("Failed to query latest migration");
  }

  const migrationId = decode(
    ...(migrationResult.results[0].data as [string, string, string]),
    protocolVersion
  )[0][0].toString();

  if (!migrationId) {
    throw new Error("Could not get migration id");
  }

  const cachedData = (await attemptReadJSONFile(
    cacheFile
  )) as CachedPageData | null;

  const schemaChanged = cachedData?.migrationId !== migrationId;

  if (schemaChanged && cachedData) {
    cachedData.data = {};
  }

  const cachedResults: CachedPageData = {migrationId, data: {}};

  const rawContent = new Map<string, string>();
  const pageRefs = new Map<string, string>();

  for (const content of pages) {
    const data = yaml.load(content);
    const parsedSection = SectionValidator.parse(data);

    for (const cat of parsedSection.categories) {
      for (const page of cat.pages) {
        const pagePath = `${parsedSection.slug}/${cat.slug}/${page.slug}`;

        if (cachedResults.data[pagePath]) {
          throw new Error(`duplicate page: ${pagePath}`);
        }

        let relname = pagePath;
        const refParts = [
          parsedSection.slug.replace(/-/g, "_"),
          cat.slug.replace(/-/g, "_"),
          page.slug.replace(/-/g, "_"),
        ];
        if (page === cat.pages[0]) {
          relname = `${parsedSection.slug}/${cat.slug}`;
          if (!page.ref) {
            pageRefs.set(refParts.slice(0, 2).join("_"), relname);
          }
        }
        pageRefs.set(page.ref ?? refParts.join("_"), relname);

        let queries: string[] = [];
        let rawText = "";
        let expectErrors: boolean[] = [];
        for (const cell of page.cells) {
          switch (cell.kind) {
            case "text":
              rawText += unescapeHtmlEntities(
                marked(cell.text, {renderer: markedPlainRenderers})
              );

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
          continue;
        }

        const pageHash = hashPageData([
          ...queries,
          ...expectErrors.map(String),
        ]);

        if (
          cachedData?.data[pagePath] &&
          cachedData.data[pagePath].hash === pageHash
        ) {
          cachedResults.data[pagePath] = cachedData.data[pagePath];
          continue;
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

        cachedResults.data[pagePath] = {
          hash: pageHash,
          results: cellsResults.results,
        };
      }
    }

    sections.push(parsedSection);
  }

  const schemaData =
    schemaChanged || !cachedData?.schemaData
      ? (await fetchSchemaData(logger))!
      : cachedData.schemaData;

  cachedResults.schemaData = schemaData;

  const tutorialData: TutorialStaticData = {
    sections: sections,
    prefetchedResults: Object.entries(cachedResults.data).reduce(
      (results, [pagePath, pageData]) => {
        results[pagePath] = pageData.results;
        return results;
      },
      {} as TutorialStaticData["prefetchedResults"]
    ),
    protocolVersion: protocolVersion ?? null,
  };

  await Promise.all([
    fs.writeFile(tutorialDataFile, JSON.stringify(tutorialData)),
    fs.writeFile(cacheFile, JSON.stringify(cachedResults)),
    fs.writeFile(
      schemaTextFile,
      JSON.stringify(
        await fs.readFile(schemaFile, {encoding: "utf8"}).then((text) =>
          text
            .trim()
            .replace(/^using extension notebook.*?\r?\n/i, "")
            .trim()
        )
      )
    ),
    fs.writeFile(schemaDataFile, JSON.stringify(schemaData)),
  ]);

  logger.log("Done!");

  return {tutorialData, rawContent, pageRefs};
}

async function fetchSchemaData(logger: Logger = console) {
  const queries = [schemaQuery];

  logger.log(`Fetching schema data ... `);
  const {data, protocolVersion} = await databaseFetch(queries);

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
