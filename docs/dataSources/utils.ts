import fs from "fs";
import {join as joinPath} from "path";
import {promisify} from "util";

const readFileAsync = promisify(fs.readFile);

export async function getSourceData(path: string[]): Promise<any> {
  const sourcePath = joinPath(
    `.build-cache`,
    ...path.slice(0, -1),
    path[path.length - 1] + ".json"
  );

  const rawData = await readFileAsync(sourcePath, "utf8");

  return JSON.parse(rawData);
}

export function pick<T extends {[key: string]: any}, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce((pickObj, key) => {
    pickObj[key] = obj[key];
    return pickObj;
  }, {} as Pick<T, K>);
}
