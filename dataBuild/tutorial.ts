import {Pipeline, PipelineStep} from "@edgedb/site-build-tools";
import {createWatchFilesStep} from "@edgedb/site-build-tools/steps";
import {buildIntersphinxInv} from "@edgedb/site-build-tools/sphinx/buildInv";

import {buildSearchIndex, summarify} from "./utils";
import {load} from "../tutorial/loader";
import {writeData} from "@edgedb/site-build-tools/utils";

export class TutorialPipeline extends Pipeline {
  constructor() {
    super("tutorial", "yellow");
  }

  async init() {}

  getSteps() {
    return [
      [createWatchFilesStep("content/tutorial")],
      {
        onRun: async ({done, failed}) => {
          try {
            const {tutorialData, rawContent, pageRefs} = await load(
              this.logger
            );

            const index = await buildSearchIndex(this, (builder) => {
              for (const section of tutorialData.sections) {
                for (const category of section.categories) {
                  for (const page of category.pages) {
                    const relname = `${section.slug}/${category.slug}/${page.slug}`;
                    const content = rawContent.get(relname)!;

                    builder.addDocument({
                      type: "section",
                      relname,
                      title: page.title,
                      content,
                      summary: summarify(content),
                    });
                  }
                }
              }
            });

            const navData = tutorialData.sections.reduce((nav, section) => {
              nav[section.slug] = {name: section.title, categories: {}};
              for (const cat of section.categories) {
                nav[section.slug].categories[cat.slug] = cat.category;
              }
              return nav;
            }, {} as {[slug: string]: {name: string; categories: {[slug: string]: string}}});

            const intersphinxInv = buildIntersphinxInv(
              {
                name: "EdgeDB Tutorial",
                version: "1.0.0",
              },
              [...pageRefs.entries()].map(([ref, relname]) => ({
                ref,
                relname,
              }))
            );

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
              writeData(
                intersphinxInv,
                ["tutorial", "objects"],
                ".inv",
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
