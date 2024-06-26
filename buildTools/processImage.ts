import { extname } from "path";
import crypto from "crypto";
import { Readable } from "stream";
import fs from "fs-extra";
import { parseXMLString } from "./xmlutils";
import {
  createThumbnailGenerator,
  ImgInfo,
  ThumbnailGenerator,
} from "./imageOpt/thumbnail";

let thumbnailGen: ThumbnailGenerator | null = null;

function getThumbnail(filePath: string) {
  return (thumbnailGen =
    thumbnailGen ?? createThumbnailGenerator()).getThumbnail(filePath);
}

export async function destroyThumbnailGen() {
  if (thumbnailGen) {
    thumbnailGen.finish();
    await thumbnailGen.done;
  }
}

export async function processImage(filePath: string) {
  const ext = extname(filePath);

  const [{ width, height, brightness, thumbnail }, hash] = await Promise.all([
    ext === ".svg" ? getSvgSize(filePath) : getThumbnail(filePath),
    hashStream("sha1", fs.createReadStream(filePath)),
  ]);

  return {
    hash,
    width,
    height,
    brightness,
    thumbnail,
  };
}

async function getSvgSize(filePath: string): Promise<ImgInfo> {
  const svgdoc = parseXMLString(
    await fs.readFile(filePath, { encoding: "utf8" })
  );
  const w = svgdoc.documentElement.attributes.getNamedItem("width")?.nodeValue;
  const h = svgdoc.documentElement.attributes.getNamedItem("height")?.nodeValue;

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

  return { width, height };
}

function hashStream(algo: string, stream: Readable) {
  return new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash(algo);
    stream.on("error", (err) => reject(err));
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}
