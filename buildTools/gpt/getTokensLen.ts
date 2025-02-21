import path from "path";
import { spawn } from "child_process";
import { pythonCmd } from "@edgedb-site/build-tools/utils";

export default async function getTokensLen(
  sections: string[]
): Promise<number[]> {
  const process = spawn(pythonCmd(), [path.join(__dirname, "getTokensLen.py")]);

  let stderr = "";

  process.stderr.setEncoding("utf8");
  process.stderr.on("data", (data) => {
    stderr += data;
  });

  process.stdin.write(JSON.stringify(sections));
  process.stdin.write("\n");

  return new Promise((resolve, reject) => {
    let tokens: string = "";

    process.stdout.on("data", (data) => {
      tokens += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(stderr);
      } else {
        resolve(JSON.parse(tokens));
      }
    });

    process.on("error", reject);
  });
}
