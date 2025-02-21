import {execFile, ExecFileOptions} from "child_process";

import path from "path";
import fs from "fs-extra";

import {getBuildDir} from "@edgedb-site/build-tools/utils";
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
