import {Pipeline, PipelineStep} from "@edgedb/site-build-tools";
import {createWatchFilesStep} from "@edgedb/site-build-tools/steps";

import {databaseFetch} from "../tutorial/loader";
import {CellResultsAPIValidator} from "../tutorial/types";
import {queryWrap} from "../tutorial/utils";

import {writeData} from "@edgedb/site-build-tools/utils";

import {replQueries} from "../content/homepage/replQueries";

export class HomepagePipeline extends Pipeline {
  constructor() {
    super("homepage", "white");
  }

  async init() {}

  getSteps() {
    return [
      [createWatchFilesStep("content/homepage")],
      {
        onRun: async ({done, failed}) => {
          try {
            const queries = replQueries.map(({query}) => query);

            this.logger.log("Fetching repl queries...");
            const response = await databaseFetch(
              queries.map((query) => queryWrap("json", query))
            );

            const cellsResults = CellResultsAPIValidator.parse(response.data);
            if (cellsResults.kind === "error") {
              throw new Error(
                `Error during pre-evaluating queries: ` +
                  `${cellsResults.error.message}`
              );
            }

            const data = {
              protocolVersion: response.protocolVersion,
              queries: queries,
              prefetchedResults: cellsResults.results,
            };

            await writeData(
              data,
              ["homepage", "replData"],
              undefined,
              this.logger
            ),
              done();
          } catch (err) {
            failed(err);
          }
        },
      } as PipelineStep,
    ];
  }
}
