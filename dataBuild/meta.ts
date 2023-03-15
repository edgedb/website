import {Pipeline, PipelineStep} from "@edgedb/site-build-tools";
import {writeData} from "@edgedb/site-build-tools/utils";

import {fetchGithubAPI} from "./utils";

export class MetaPipeline extends Pipeline {
  constructor() {
    super("meta", "white");
  }

  async init() {}

  getSteps() {
    return [
      {
        onRun: async ({done, failed}) => {
          try {
            const data = await fetchGithubAPI("/repos/edgedb/edgedb");

            const stars = data?.stargazers_count;

            if (typeof stars !== "number" || Number.isNaN(stars)) {
              throw new Error("Failed to fetch star count for edgedb/edgedb");
            }

            this.logger.log(`edgedb/edgedb star count: ${stars}`);
            await writeData(
              {starCount: stars},
              ["metadata"],
              undefined,
              this.logger
            );

            done();
          } catch (err) {
            failed(err);
          }
        },
      } as PipelineStep,
    ];
  }
}
