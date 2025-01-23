import fs from "fs-extra";
import { join as pathJoin } from "path";
import { createClient } from "@vercel/remote";

const CACHE_DIR = "../.shared-cache";

const token = process.env.VERCEL_ARTIFACTS_TOKEN;
const teamId = process.env.VERCEL_ARTIFACTS_OWNER;
const remote =
  token && teamId
    ? createClient(token, {
        teamId,
        product: "edgedb-docs-build",
      })
    : null;

fs.ensureDirSync(CACHE_DIR);

export async function getCacheItem(
  key: string,
  asBuffer?: false
): Promise<string | null>;
export async function getCacheItem(
  key: string,
  asBuffer: true
): Promise<Buffer | null>;
export async function getCacheItem(key: string, asBuffer = false) {
  try {
    return await fs.readFile(
      pathJoin(CACHE_DIR, key),
      !asBuffer ? { encoding: "utf8" } : {}
    );
  } catch {
    try {
      const item = await remote?.get(key).buffer();
      if (item) {
        fs.writeFile(pathJoin(CACHE_DIR, key), item);
        return asBuffer ? item : item.toString("utf8");
      }
    } catch {}
  }
  return null;
}

export async function setCacheItem(
  key: string,
  value: string | Buffer,
  useLocalCache: boolean = true
) {
  await Promise.all([
    ...(useLocalCache
      ? [
          fs.writeFile(
            pathJoin(CACHE_DIR, key),
            value,
            typeof value === "string" ? { encoding: "utf8" } : {}
          ),
        ]
      : []),
    ...(remote
      ? [
          remote
            .put(key)
            .buffer(
              typeof value === "string" ? Buffer.from(value, "utf8") : value
            ),
        ]
      : []),
  ]);
}
