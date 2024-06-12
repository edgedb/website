import {Pipeline, PipelineStep} from "@edgedb-site/build-tools";
import {createWatchFilesStep} from "@edgedb-site/build-tools/steps";

import {databaseFetch} from "@edgedb-site/shared/tutorial/loader";
import {CellResultsAPIValidator} from "@edgedb-site/shared/tutorial/types";
import {queryWrap} from "@edgedb-site/shared/tutorial/utils";

import {writeData} from "@edgedb-site/build-tools/utils";

import {replQueries} from "../content/homepage/replQueries";
import {getCacheItem} from "@edgedb-site/build-tools/caching";

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

            const [schemaData, schemaText] = await Promise.all([
              getCacheItem("tutorial-latest-schemaData"),
              getCacheItem("tutorial-latest-schemaText", true),
            ]);
            if (schemaData == null || schemaText == null) {
              throw new Error(
                "failed to find schema data from docs build, " +
                  "ensure docs build has previously been run"
              );
            }

            const data = {
              protocolVersion: response.protocolVersion,
              queries: queries,
              prefetchedResults: cellsResults.results,
            };

            await Promise.all([
              writeData(
                data,
                ["homepage", "replData"],
                undefined,
                this.logger
              ),
              writeData(
                schemaData,
                ["tutorial", "schema-data"],
                undefined,
                this.logger,
                true
              ),
              writeData(
                schemaText,
                ["tutorial", "schema-text"],
                undefined,
                this.logger,
                true
              ),
            ]);
            done();
          } catch (err) {
            failed(err);
          }
        },
      } as PipelineStep,
    ];
  }
}
