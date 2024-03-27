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
    new HomepagePipeline(),
    {
      pipeline: new ImageOptPipeline(),
      waitOn: new Set(["blog"]),
    },
    {
      pipeline: new NextJSPipeline(),
      waitOn: new Set(["meta", "blog", "imageOpt", "homepage"]),
    },
  ],
});

runner.start();
