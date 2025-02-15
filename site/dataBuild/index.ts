import fs from "fs-extra";
import {join as pathJoin} from "path";

import dotenv from "dotenv";

dotenv.config();
dotenv.config({path: ".env.local"});

import {PipelineRunner, NextJSPipeline} from "@edgedb-site/build-tools";
import {getBuildDir} from "@edgedb-site/build-tools/utils";

import flags from "./flags";

import {MetaPipeline} from "./meta";
import {BlogPipeline} from "./blog";
import {ImageOptPipeline} from "@edgedb-site/build-tools/imageOpt";
import {HomepagePipeline} from "./homepage";
import {UpdatesPipeline} from "./updates";
import {LatestInfoPipeline} from "./latestInfo";

process.on("unhandledRejection", (reason) => {
  console.error(reason);
  process.exit(1);
});

const buildDir = getBuildDir();

fs.ensureDirSync(buildDir);
if (flags.clean) {
  const dir = fs.readdirSync(buildDir);
  for (const item of dir) {
    fs.rm(pathJoin(buildDir, item), {recursive: true});
  }
}

const runner = new PipelineRunner({
  watchMode: !!flags.watch,
  skip: flags.skip,
  only: flags.only,
  pipelines: [
    new MetaPipeline(),
    {pipeline: new BlogPipeline()},
    {pipeline: new UpdatesPipeline()},
    new HomepagePipeline(),
    {
      pipeline: new ImageOptPipeline(),
      waitOn: new Set(["blog", "updates"]),
    },
    {
      pipeline: new NextJSPipeline(),
      waitOn: new Set(["meta", "blog", "updates", "imageOpt", "homepage"]),
    },
    {
      pipeline: new LatestInfoPipeline(),
      waitOn: new Set(["blog", "updates"]),
    },
  ],
});

runner.start();
