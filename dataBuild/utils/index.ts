import {execFile, ExecFileOptions} from "child_process";
import {createHash} from "crypto";
import {gzip} from "zlib";
import path from "path";
import fs from "fs-extra";
import fetch from "node-fetch";

import {Pipeline} from "@edgedb/site-build-tools";
import JolrBuilder from "@edgedb/site-build-tools/jolr/builder";
import {getBuildDir} from "@edgedb/site-build-tools/utils";
import {IndexBlock} from "../interfaces";
import flags from "../flags";

export function execAsync(
  command: string,
  args?: string[],
  opts?: {encoding?: string | null} & ExecFileOptions
) {
  return new Promise<string>((resolve, reject) => {
    execFile(
      command,
      args,
      {encoding: "utf8", ...opts},
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        }
        resolve(stdout as string);
      }
    );
  });
}

function compressData(data: any) {
  return new Promise<Buffer>((resolve, reject) => {
    gzip(data, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
}

export async function buildSearchIndex(
  {name, logger}: Pipeline,
  indexer: (builder: JolrBuilder<IndexBlock>) => void
) {
  let log = `Created "${name}" search index in`;
  logger.time(log);

  const builder = new JolrBuilder<IndexBlock>();

  builder.addField("type", {
    publish: true,
    type: "enum",
    index: true,
    required: true,
  });
  builder.addField("target", {
    publish: true,
  });
  builder.addField("relname", {
    publish: true,
    type: "enum",
    required: true,
  });
  builder.addField("name", {
    publish: true,
    index: true,
    type: "name",
  });
  builder.addField("title", {
    publish: true,
    type: "name",
    index: true,
  });
  builder.addField("content", {
    index: true,
  });
  builder.addField("summary", {
    publish: true,
    index: true,
  });
  builder.addField("signature", {
    publish: true,
    index: true,
    customTokenizer: (str, doc) => {
      if (doc.type === "operator") {
        return str
          .split("->")[0]
          .split(/\s+/)
          .filter((opPart) => {
            if (!opPart) return false;
            return /^[^A-Za-z0-9]+$/.test(opPart);
          });
      }
      return [];
    },
  });
  builder.addField("index", {
    publish: false,
    index: true,
    type: "name",
  });
  builder.addField("version", {
    type: "enum",
    publish: true,
    index: false,
  });

  indexer(builder);

  const indexJSON = builder.toJSON();

  // Check for broken index documents
  {
    const fields = indexJSON.fields as any[];
    const signature = fields.findIndex((f) => f._name === "signature"),
      title = fields.findIndex((f) => f._name === "title"),
      name = fields.findIndex((f) => f._name === "name"),
      summary = fields.findIndex((f) => f._name === "summary"),
      content = fields.findIndex((f) => f._name === "content");

    const brokenIndexDocs = indexJSON.documents.filter(
      (doc) =>
        !(doc[signature] || doc[title] || doc[name]) ||
        !(doc[summary] || doc[content])
    );
    if (brokenIndexDocs.length > 0) {
      throw new Error(
        `${brokenIndexDocs.length} documents in search index are missing needed fields`
      );
    }
  }

  let hash = createHash("sha1")
    .update(JSON.stringify(indexJSON))
    .digest("hex");

  const data = JSON.stringify({
    id: hash,
    index: indexJSON,
  });

  const compressedData = await compressData(data);

  logger.info(
    `Created search index for "${name}"; ` +
      `documents count: ${indexJSON.documents.length}; ` +
      `size: ${data.length} bytes; ` +
      `compressed size: ${compressedData.byteLength} bytes`
  );

  logger.timeEnd(log);
  return compressedData;
}

export function summarify(text: string, maxLength = 80): string {
  let summaryLen = 0;
  let summaryWords = text.split(/\s/g);
  let broke = false;
  let summary = [];
  for (let word of summaryWords) {
    summaryLen += word.length + 1;
    if (summaryLen > maxLength) {
      broke = true;
      break;
    }
    summary.push(word);
  }

  return summary.join(" ") + (broke ? " ..." : "");
}

const htmlEntities = {
  quot: '"',
  lt: "<",
  gt: ">",
};

const unescapeHtmlEntitiesRegex = RegExp(
  `&(?:#([0-9]+)|#x([0-9a-fA-F]+)|(${Object.keys(htmlEntities).join("|")}));`,
  "g"
);

export function unescapeHtmlEntities(text: string): string {
  return text.replace(
    unescapeHtmlEntitiesRegex,
    (_, dCodePoint, hCodePoint, entityName) => {
      if (dCodePoint) {
        return String.fromCodePoint(parseInt(dCodePoint, 10));
      }
      if (hCodePoint) {
        return String.fromCodePoint(parseInt(hCodePoint, 16));
      }
      if (entityName) {
        return htmlEntities[entityName as keyof typeof htmlEntities];
      }
      return "";
    }
  );
}

const username = process.env.GITHUB_EDGEDB_CI_USERNAME;
const accessToken = process.env.GITHUB_EDGEDB_CI_ACCESS_TOKEN;

const authHeaderToken =
  username &&
  accessToken &&
  `Basic ${Buffer.from(username + ":" + accessToken).toString("base64")}`;

const githubDataCacheFile = path.join(getBuildDir(), "githubDataCache.json");

type CachedGithubData = {
  [route: string]: {lastFetch: number; data: any};
};

let cachedData: CachedGithubData | null = null;

let pendingCacheRead: Promise<CachedGithubData> | null = null;
async function getCachedData(): Promise<CachedGithubData> {
  if (cachedData) {
    return cachedData;
  }
  if (!pendingCacheRead) {
    pendingCacheRead = (async () => {
      try {
        cachedData = JSON.parse(
          await fs.readFile(githubDataCacheFile, "utf8")
        );
      } catch {
        cachedData = {};
      }
      return cachedData as CachedGithubData;
    })();
  }
  return pendingCacheRead;
}

export async function fetchGithubAPI(route: string) {
  if (!route.startsWith("/")) {
    route = "/" + route;
  }

  const cachedData = await getCachedData();

  if (
    cachedData[route] === undefined ||
    cachedData[route].lastFetch < Date.now() - 1000 * 60 * 60 * 24 * 7 // 1 week
  ) {
    const res = await fetch(`https://api.github.com${route}`, {
      headers: {
        ...(authHeaderToken ? {Authorization: authHeaderToken} : {}),
        "User-Agent": "EdgeDB site build",
      },
    });
    if (!res.ok) {
      if (!flags.watch) {
        // prod build
        throw Error(`Error accessing the GitHub API: ${res.statusText}`);
      } else {
        return cachedData[route]?.data ?? {};
      }
    }
    cachedData[route] = {
      lastFetch: Date.now(),
      data: await res.json(),
    };
    await fs.writeFile(githubDataCacheFile, JSON.stringify(cachedData));
  }

  return cachedData[route].data;
}
