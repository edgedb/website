import fs from "fs-extra";
import { join as pathJoin } from "path";

import "@edgedb-site/build-tools/env";

import { NextJSPipeline, PipelineRunner } from "@edgedb-site/build-tools";
import { getBuildDir } from "@edgedb-site/build-tools/utils";

import flags from "./flags";

import { DocsPipeline } from "./docs";
import { getEasyEDBPipelines } from "./easyedb";
import { TutorialPipeline } from "./tutorial";
import { ImageOptPipeline } from "@edgedb-site/build-tools/imageOpt";

process.on("unhandledRejection", (reason) => {
  console.error(reason);
  process.exit(1);
});

const buildDir = getBuildDir();

fs.ensureDirSync(buildDir);
if (flags.clean) {
  const dir = fs.readdirSync(buildDir);
  for (const item of dir) {
    fs.rm(pathJoin(buildDir, item), { recursive: true });
  }
}

const runner = new PipelineRunner({
  watchMode: !!flags.watch,
  skip: flags.skip,
  only: flags.only,
  pipelines: [
    new DocsPipeline(),
    ...getEasyEDBPipelines({ waitOn: new Set(["docs"]) }),
    new TutorialPipeline(),
    {
      pipeline: new ImageOptPipeline(),
      waitOn: new Set(["docs", "easyedb"]),
    },
    {
      pipeline: new NextJSPipeline(),
      waitOn: new Set(["docs", "easyedb", "tutorial", "imageOpt"]),
    },
  ],
});

runner.start();
