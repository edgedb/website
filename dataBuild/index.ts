import {spawn} from "child_process";
import * as readline from "readline";
import fs from "fs-extra";

// loads env from `.env`
import dotenv from "dotenv";
dotenv.config();

import {
  Pipeline,
  PipelineRunner,
  PipelineStep,
} from "@edgedb/site-build-tools";
import {getBuildDir} from "@edgedb/site-build-tools/utils";

import flags from "./flags";

import {MetaPipeline} from "./meta";
import {DocsPipeline} from "./docs";
import {BlogPipeline} from "./blog";
import {getEasyEDBPipelines} from "./easyedb";
import {TutorialPipeline} from "./tutorial";
import {ImageOptPipeline} from "./optimiseImages";
import {HomepagePipeline} from "./homepage";

process.on("unhandledRejection", (reason) => {
  console.error(reason);
  process.exit(1);
});

if (flags.clean) {
  fs.emptyDirSync(getBuildDir());
} else {
  fs.ensureDirSync(getBuildDir());
}

class NextJSPipeline extends Pipeline {
  constructor() {
    super("nextjs", "green");
  }

  async init() {}

  getSteps() {
    return [
      {
        onRun: async () => {
          const nextProcess = spawn("yarn", ["next", "dev"], {
            env: {
              ...process.env,
              FORCE_COLOR: "1",
            },
          });
          const stdout = readline.createInterface(nextProcess.stdout);
          const stderr = readline.createInterface(nextProcess.stderr);

          stdout.on("line", (line) => this.logger.log(line));
          stderr.on("line", (line) => this.logger.error(line));
        },
      } as PipelineStep,
    ];
  }
}

const runner = new PipelineRunner({
  watchMode: !!flags.watch,
  skip: flags.skip,
  only: flags.only,
  pipelines: [
    new MetaPipeline(),
    {
      pipeline: new DocsPipeline(),
      waitOn: new Set(["tutorial"])
    },
    {pipeline: new BlogPipeline(), waitOn: new Set(["docs"])},
    ...getEasyEDBPipelines({waitOn: new Set(["docs"])}),
    new TutorialPipeline(),
    new HomepagePipeline(),
    {
      pipeline: new ImageOptPipeline(),
      waitOn: new Set(["blog", "easyedb"]),
    },
    {
      pipeline: new NextJSPipeline(),
      waitOn: new Set([
        "meta",
        "docs",
        "blog",
        "easyedb",
        "tutorial",
        "imageOpt",
        "homepage",
      ]),
    },
  ],
});

runner.start();
