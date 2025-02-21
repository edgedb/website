import { spawn } from "child_process";
import { createInterface } from "readline";
import path from "path";
import { pythonCmd } from "@edgedb-site/build-tools/utils";
import createSerializer from "./serializer";

export interface ImgInfo {
  width: number;
  height: number;
  brightness?: number;
  thumbnail?: string;
}

const serializer = createSerializer<ImgInfo>();

export function createThumbnailGenerator() {
  const proc = spawn(pythonCmd(), [path.join(__dirname, "thumbnail.py")]);
  let stderr = "";

  proc.stderr.setEncoding("utf8");
  proc.stderr.on("data", (data) => {
    stderr += data;
  });
  const readline = createInterface({ input: proc.stdout });
  const awaitingLines: ((line: string) => void)[] = [];
  readline.addListener("line", (line) => awaitingLines.pop()?.(line));

  return {
    getThumbnail(sourcePath: string) {
      return serializer(() => {
        proc.stdin.write(`  ${path.resolve(sourcePath)}\n`);
        return new Promise<ImgInfo>((resolve, reject) => {
          awaitingLines.unshift((line) => {
            try {
              resolve(JSON.parse(line));
            } catch (err) {
              reject(err);
            }
          });
        });
      });
    },
    finish() {
      proc.stdin.write("\n");
    },
    done: new Promise<void>((resolve, reject) => {
      proc.on("close", (code) => {
        if (code !== 0) {
          reject(stderr);
        } else {
          resolve();
        }
      });
      proc.on("error", reject);
    }),
  };
}

export type ThumbnailGenerator = ReturnType<typeof createThumbnailGenerator>;
