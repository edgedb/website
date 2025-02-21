import { join as pathJoin, dirname, basename, extname } from "path";
import tmp from "tmp";
import chokidar from "chokidar";
import fs from "fs-extra";
import crypto from "crypto";
import { execFile } from "child_process";

import type { ExecFileOptions } from "child_process";

import { processImage } from "./processImage";
import { FileInfo } from "./steps";
import { Logger } from "./logger";

export * from "./searchUtils";

let buildDir = ".build-cache";

export function getBuildDir() {
  return buildDir;
}
export function setBuildDir(dir: string) {
  buildDir = dir;
}

tmp.setGracefulCleanup();

export function pythonCmd() {
  return process.env.VIRTUAL_ENV
    ? "python"
    : pathJoin(__dirname, "../.venv/bin/python");
}

export async function runPython(args: string[], opts: ExecFileOptions = {}) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(
      pythonCmd(),
      args,
      opts,
      (err: Error | null, stdout: string, stderr: string) => {
        if (err) {
          reject(err);
        } else {
          resolve({ stdout, stderr });
        }
      }
    );
  });
}

export async function getTempDir(tmpdir?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    tmp.dir({ unsafeCleanup: true, tmpdir }, (err, name) => {
      if (err) reject(err);
      else {
        resolve(name);
      }
    });
  });
}

export async function cleanBuildDir(path: string[]) {
  await fs.emptyDir(pathJoin(getBuildDir(), ...path));
}

export function watchFiles(
  files: string | string[],
  onUpdate: (
    type: "add" | "addDir" | "change" | "unlink" | "unlinkDir",
    path: string
  ) => void,
  onReady?: () => void,
  ignoreInitial = false
) {
  const watcher = chokidar.watch(files, {
    ignoreInitial,
  });

  watcher.on("all", onUpdate);

  if (onReady) {
    watcher.on("ready", onReady);
  }

  return () => watcher.close();
}

export function pathWithoutExt(path: string) {
  return pathJoin(dirname(path), basename(path, extname(path)));
}

export function debounce<F extends Function>(func: F, delay: number = 500) {
  let timer: NodeJS.Timeout;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(() => func(), delay);
  };
}

export function sortFirst(cond: (change: FileInfo) => boolean) {
  return (changes: FileInfo[]): FileInfo[][] => {
    const first: FileInfo[] = [];
    const rest: FileInfo[] = [];
    for (const change of changes) {
      (cond(change) ? first : rest).push(change);
    }
    return [first, rest];
  };
}

export function strToId(str: string): string {
  return crypto.createHash(`sha1`).update(str).digest(`hex`);
}

export async function writeData(
  data: any,
  outPath: string[],
  ext = ".json",
  logger: Logger = console,
  rawData = false
) {
  const outputPath = pathJoin(
    getBuildDir(),
    ...outPath.slice(0, -1),
    outPath[outPath.length - 1] + ext
  );

  logger.log(`Writing data to ${outputPath}`);
  await fs.outputFile(outputPath, rawData ? data : JSON.stringify(data));
}

export async function copyAsset(
  sourceDir: string,
  filename: string,
  name: string,
  group: string,
  logger: Logger = console
) {
  const sourcePath = pathJoin(sourceDir, filename);
  const targetPath = pathJoin(getBuildDir(), "_assets", name, group, filename);

  try {
    await fs.copy(sourcePath, targetPath, {
      overwrite: false,
      errorOnExist: true,
    });
    logger.log("copied asset:", sourcePath, "->", targetPath);
  } catch {}

  return filename;
}

class ImageDimensionError extends Error {}

export const optimisableExts = [".jpg", ".jpeg", ".png"];

export async function copyImage(
  sourceDir: string,
  filename: string,
  name: string,
  sizes: string,
  logger: Logger = console
) {
  const fileExt = extname(filename);
  const sourcePath = pathJoin(sourceDir, filename);
  const darkSourcePath = pathJoin(
    sourceDir,
    `${pathWithoutExt(filename)}.dark${fileExt}`
  );

  const { hash, width, height, brightness, thumbnail } = await processImage(
    sourcePath
  );

  let darkHash: string | null = null;
  if (await fs.pathExists(darkSourcePath)) {
    const {
      hash: dHash,
      width: dWidth,
      height: dHeight,
    } = await processImage(darkSourcePath);

    darkHash = dHash;

    if (dWidth !== width || dHeight !== height) {
      throw new ImageDimensionError(
        "dark image variant does not have same dimensions as light image"
      );
    }
  }

  const targetName = pathJoin("_" + name, hash);
  const targetUrl = pathJoin("_images", targetName);

  const targetPath = pathJoin("images", targetName + sizes + fileExt);

  try {
    await fs.copy(sourcePath, targetPath, {
      overwrite: false,
      errorOnExist: true,
    });
    logger.log("copied image:", sourcePath, "->", targetPath);
  } catch {}

  let darkTargetUrl: string | null = null;
  if (darkHash) {
    const darkTargetName = pathJoin("_" + name, darkHash);
    darkTargetUrl = pathJoin(`_images`, darkTargetName);

    const darkTargetPath = pathJoin("images", darkTargetName + sizes + fileExt);

    try {
      await fs.copy(darkSourcePath, darkTargetPath, {
        overwrite: false,
        errorOnExist: true,
      });
      logger.log("copied image:", darkSourcePath, "->", darkTargetPath);
    } catch {}
  }

  const includeFileExt = optimisableExts.includes(fileExt) ? "" : fileExt;

  return {
    filename,
    path: `/${targetUrl}${includeFileExt}`,
    pathIncludesExt: !!includeFileExt,
    width,
    height,
    brightness,
    thumbnail,
    darkPath: darkTargetUrl ? `/${darkTargetUrl}${includeFileExt}` : undefined,
  };
}

export function execAsync(
  command: string,
  args?: string[],
  opts?: { encoding?: string | null } & ExecFileOptions
) {
  return new Promise<string>((resolve, reject) => {
    execFile(
      command,
      args,
      { encoding: "utf8", ...opts },
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        }
        resolve(stdout as string);
      }
    );
  });
}

export function toAbsoluteURI(
  relativeURI: string,
  ctx: { relname?: string }
): string {
  if (!ctx.relname || relativeURI.startsWith("/")) {
    return relativeURI;
  }

  let stack = ctx.relname.split("/"),
    parts = relativeURI.split("/");
  stack.pop();
  for (let part of parts) {
    if (part == ".") {
      continue;
    }

    if (part == "..") {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join("/");
}
