import { Pipeline, PipelineStep } from "@edgedb-site/build-tools";
import { createWatchFilesStep } from "@edgedb-site/build-tools/steps";

import {
  buildSearchIndex,
  summarify,
  writeData,
} from "@edgedb-site/build-tools/utils";
import { load } from "@edgedb-site/shared/tutorial/loader";

export class TutorialPipeline extends Pipeline {
  constructor() {
    super("tutorial", "yellow");
  }

  async init() {}

  getSteps() {
    return [
      [createWatchFilesStep("content/tutorial")],
      {
        onRun: async ({ done, failed }) => {
          try {
            const { tutorialData, rawContent, navData } = await load(
              this.logger
            );

            const index = await buildSearchIndex((builder) => {
              for (const [pagePath, page] of Object.entries(
                tutorialData.pages
              )) {
                const content = rawContent.get(pagePath)!;

                builder.addDocument({
                  type: "section",
                  relname: `/${page.relname}`,
                  title: page.title,
                  content: content,
                  summary: summarify(content),
                });
              }
            }, this);

            await Promise.all([
              writeData(
                index,
                ["tutorial", "tutorialsearch"],
                ".jolrindex",
                this.logger,
                true
              ),
              writeData(
                navData,
                ["tutorial", "navData"],
                undefined,
                this.logger
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
