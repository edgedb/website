import {extname, join} from "path";
import crypto from "crypto";
import {Readable} from "stream";
import fs from "fs-extra";
import {parseXMLString} from "./xmlutils";
import {runPython} from "./utils";

export async function processImage(filePath: string) {
  const ext = extname(filePath);

  const [{width, height, thumbnail}, hash] = await Promise.all([
    ext === ".svg" ? getSvgSize(filePath) : getThumbnail(filePath),
    hashStream("sha1", fs.createReadStream(filePath)),
  ]);

  return {
    hash,
    width,
    height,
    thumbnail,
  };
}

interface ImgInfo {
  width: number;
  height: number;
  thumbnail?: string;
}

async function getThumbnail(filePath: string): Promise<ImgInfo> {
  let {stdout} = await runPython(
    [join(__dirname, "thumbnail.py"), filePath]);
  return JSON.parse(stdout);
}

async function getSvgSize(filePath: string): Promise<ImgInfo> {
  const svgdoc = parseXMLString(
    await fs.readFile(filePath, {encoding: "utf8"})
  );
  const w = svgdoc.documentElement.attributes.getNamedItem("width")?.nodeValue;
  const h = svgdoc.documentElement.attributes.getNamedItem("height")
    ?.nodeValue;

  const width = w && parseInt(w, 10);
  const height = h && parseInt(h, 10);

  if (
    typeof width !== "number" ||
    Number.isNaN(width) ||
    typeof height !== "number" ||
    Number.isNaN(height)
  ) {
    throw new Error(`Could not get 'width' and 'height' of svg`);
  }

  return {width, height};
}

function hashStream(algo: string, stream: Readable) {
  return new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash(algo);
    stream.on("error", (err) => reject(err));
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}
