import fs from "fs-extra";
import path from "path";
import { Pipeline } from "@edgedb-site/build-tools";
import { createWatchFilesStep } from "@edgedb-site/build-tools/steps";
import { optimisableExts } from "@edgedb-site/build-tools/utils";

import { createOptimiser, Optimiser } from "./optimise";
import { getCacheItem, setCacheItem } from "../caching";

const sourceDir = "images/";
const targetDir = "public/_images";

export class ImageOptPipeline extends Pipeline {
  constructor() {
    super("imageOpt", "white");
  }

  async init() {}

  getSteps() {
    let queue: string[] = [];

    return [
      createWatchFilesStep(
        sourceDir,
        undefined,
        async (info) => {
          if (info.type === "add" || info.type === "change") {
            queue.push(info.path);
          }
        },
        async () => {
          this.logger.log(`Optimising ${queue.length} images...`);

          this.logger.time(`Optimising done`);

          const optimiser = createOptimiser();
          const optimisedImages = await Promise.all(
            queue.map((imagePath) => optimiseImage(imagePath, optimiser))
          );
          optimiser.finish();
          await optimiser.done;

          await Promise.all(
            optimisedImages
              .flat()
              .map(async ({ cacheKey, targetPath }) =>
                setCacheItem(cacheKey, await fs.readFile(targetPath), false)
              )
          );

          this.logger.timeEnd(`Optimising done`);

          queue = [];
        }
      ),
    ];
  }
}

async function optimiseImage(imagePath: string, optimiser: Optimiser) {
  const relPath = path.dirname(path.relative(sourceDir, imagePath));

  const [match, basename, noRetina, sizes] = [
    ...(path
      .basename(imagePath, path.extname(imagePath))
      .match(/^([^\[\]!]+)(!?)(?:\[((?:[\d,_]|meta)+)\])?$/) ?? []),
  ];

  if (!match) {
    throw new Error(`Could not parse filename: ${imagePath}`);
  }

  const targetPath = path.join(targetDir, relPath);

  await fs.ensureDir(targetPath);

  if (!optimisableExts.includes(path.extname(imagePath))) {
    await fs.copyFile(
      imagePath,
      path.join(targetPath, basename + path.extname(imagePath))
    );
    return [];
  }

  const parsedSizes = sizes
    ? sizes
        .split(",")
        .filter((s) => s)
        .flatMap<{ size: number | null; suffix?: string; ext?: string }>(
          (s) => {
            if (s === "_") {
              return [{ size: null }];
            }
            if (s === "meta") {
              return [{ size: 1200, ext: ".jpg" }];
            }
            const size = parseInt(s, 10);
            if (Number.isNaN(size) || size <= 0) {
              throw new Error(`Invalid size ${s}, expected a positive int`);
            }
            return [
              { size, suffix: `-${size}` },
              ...(!noRetina ? [{ size: size * 2, suffix: `-${size}-2x` }] : []),
            ];
          }
        )
    : [{ size: null }];

  const output: Promise<{
    targetPath: string;
    width: number;
    cacheKey: string;
  } | null>[] = [];

  for (const { size, suffix, ext } of parsedSizes) {
    const targetFilename = basename + (suffix ?? "") + (ext ?? ".webp");
    const targetFile = path.join(targetPath, targetFilename);

    output.push(
      fs.pathExists(targetFile).then(async (exists) => {
        if (exists) {
          return null;
        }

        const cacheKey = `imgOpt-${targetFilename}`;
        const optImgData = await getCacheItem(cacheKey, true);

        if (optImgData) {
          await fs.writeFile(targetFile, optImgData);
          return null;
        }

        return { targetPath: targetFile, width: size ?? -1, cacheKey };
      })
    );
  }

  const needOptimising = (await Promise.all(output)).filter(
    (item) => item !== null
  ) as { targetPath: string; width: number; cacheKey: string }[];

  if (needOptimising.length) {
    optimiser.addImage(imagePath, needOptimising);
  }
  return needOptimising;
}
