import {spawn} from "child_process";
import path from "path";
import {pythonCmd} from "@edgedb/site-build-tools/utils";

export function createOptimiser() {
  const proc = spawn(
    pythonCmd(),
    [path.join(__dirname, "optimise.py")]
  );
  let stderr = "";

  proc.stderr.setEncoding("utf8");
  proc.stderr.on("data", (data) => {
    stderr += data;
  });

  return {
    addImage(
      sourcePath: string,
      sizes: {targetPath: string; width: number}[]
    ) {
      proc.stdin.write(
        `${sourcePath} ${sizes
          .map(({targetPath, width}) => `${targetPath} ${width}`)
          .join(" ")}\n`
      );
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

export type Optimiser = ReturnType<typeof createOptimiser>;
