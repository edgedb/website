import {join as pathJoin} from "path";
import matter from "gray-matter";
import fs from "fs-extra";

import {Pipeline, PipelineStep} from "@edgedb/site-build-tools";
import {NodeStore} from "@edgedb/site-build-tools/nodeStore";
import {
  createCopyFilesStep,
  createProcessSphinxXMLStep,
  createRunSphinxBuildStep,
  FileInfo,
  injectConfPy,
} from "@edgedb/site-build-tools/steps";
import {
  copyImage,
  getTempDir,
  sortFirst,
  writeData,
} from "@edgedb/site-build-tools/utils";

import {transformXML, XMLNode} from "@edgedb/site-build-tools/xmlutils";

import {BookChapter, QuizAnswers, IndexBlock, ImageInfo} from "./interfaces";
import {buildSearchIndex, summarify} from "./utils";
import {renderXML} from "./xmlRenderer";
import {easyEDBRenderers} from "./xmlRenderer/easyedbRenderers";

import buildConfig from "../build.config";
import {intersphinxConfig} from "./intersphinx";
import flags from "./flags";

export function getEasyEDBPipelines(opts?: {waitOn?: Set<string>}) {
  const langs = flags.watch
    ? []
    : fs
        .readdirSync(pathJoin(buildConfig.repoPaths.easyedb, "translations"), {
          withFileTypes: true,
        })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

  return [
    {pipeline: new EasyEDBPipeline(), ...opts},
    ...langs.map((lang) => ({
      pipeline: new EasyEDBPipeline(lang),
      ...opts,
    })),
  ];
}

const leadImagesCache = new Map<number, ImageInfo>();

export class EasyEDBPipeline extends Pipeline {
  constructor(public lang?: string) {
    super("easyedb", "magenta", lang ? `easyedb (${lang})` : "easyedb");
    this.processXMLFile = this.processXMLFile.bind(this);
  }

  tmpDir?: string;
  async init() {
    this.tmpDir = await getTempDir();
  }

  chapterStore = new NodeStore<BookChapter>();
  answerStore = new NodeStore<QuizAnswers>();

  frontmatter = new Map<string, any>();

  getSteps() {
    const cleanRemovedFiles = ({
      type,
      relname,
    }: {
      type: "unlink" | "add" | "change";
      relname: string;
    }) => {
      if (type === "unlink") {
        this.chapterStore.deleteNode(relname);
      }
    };

    return [
      [
        createCopyFilesStep(
          this.lang
            ? pathJoin(
                buildConfig.repoPaths.easyedb,
                "translations",
                this.lang
              )
            : buildConfig.repoPaths.easyedb,
          this.tmpDir!,
          "chapter*/*",
          cleanRemovedFiles,
          (file, path) => {
            if (!path.endsWith("index.md")) {
              return file;
            }

            const {data, content} = matter(file.toString("utf8"));

            const chapter = path.split("/").slice(-2)[0];

            this.frontmatter.set(chapter, data);

            return content;
          }
        ),
        ...(this.lang
          ? [
              createCopyFilesStep(
                buildConfig.repoPaths.easyedb,
                this.tmpDir!,
                "chapter*/*.!(md)"
              ),
            ]
          : []),
      ],
      injectConfPy(this.tmpDir!, null, {...intersphinxConfig}),
      createRunSphinxBuildStep({
        sourceDir: this.tmpDir!,
        indexFile: "chapter0/index",
        sphinxPath: buildConfig.sphinxPath,
        extraArgs: [/*"-W",*/ "-n"],
        extraExtensions: [
          "myst_parser",
          "edb.tools.docs.eql",
          "sphinx.ext.intersphinx",
        ],
        extraEnv: {
          PYTHONPATH: buildConfig.repoPaths.edgedb,
        },
      }),
      createProcessSphinxXMLStep(
        this.processXMLFile,
        sortFirst((change) => change.relname.endsWith("answers"))
      ),
      {
        onRun: async ({done, failed}) => {
          try {
            const chapters = this.chapterStore.getAllNodes();

            const index = !this.lang ? await this.createSearchIndex() : null;

            const path = ["easyedb", this.lang ?? "en"];

            await Promise.all([
              writeData(
                chapters
                  .sort((a, b) => a.chapterNo - b.chapterNo)
                  .map(({chapterNo, chapterName, title, tags}) => ({
                    chapterNo,
                    chapterName,
                    title,
                    tags,
                  })),
                [...path, "nav"],
                undefined,
                this.logger
              ),
              writeData(
                {chapters},
                [...path, "chapters"],
                undefined,
                this.logger
              ),
              ...(index
                ? [
                    writeData(
                      index,
                      [...path, "easyedbsearch"],
                      ".jolrindex",
                      this.logger,
                      true
                    ),
                  ]
                : []),
            ]);

            done();
          } catch (err) {
            failed(err);
          }
        },
      } as PipelineStep,
    ];
  }

  async processXMLFile(file: string, fileInfo: FileInfo) {
    const tree = transformXML(file);

    const basename = fileInfo.relname.split("/").pop() ?? "";

    const chapterNo = parseInt(
      fileInfo.relname.split("/")[0].replace(/[^\d]/g, ""),
      10
    );

    switch (basename) {
      case "index": {
        this.logger.info(`processing chapter node: ${fileInfo.relname}`);

        const {title, chapterName} = this.extractMetadata(tree);

        this.wrapBlock(tree, "quiz", "enumerated_list");
        this.wrapBlock(tree, "hidden");

        tree
          .lookupAllChildren("reference")
          .filter((node) => node.attrs.refuri === "code")
          .forEach((node) => {
            node["_attrs"].internal = undefined;
            node[
              "_attrs"
            ].refuri = `https://github.com/edgedb/easy-edgedb/blob/master/${
              fileInfo.relname.split("/")[0]
            }/code.md`;
          });

        const index = this.makeIndex(tree, fileInfo.relname);

        const {content, headers} = await renderXML(
          tree,
          {
            rootDir: this.tmpDir!,
            relname: `/easy-edgedb/chapter${chapterNo}/index`,
            logger: this.logger,
            lang: this.lang,
            customData: {
              getQuizAnswers: () => {
                const answers = this.answerStore.getNode(chapterNo.toString())
                  ?.document;
                if (!answers) {
                  throw new Error(`No answers found for chapter ${chapterNo}`);
                }
                return answers;
              },
            },
          },
          easyEDBRenderers
        );

        const frontmatter = this.frontmatter.get(`chapter${chapterNo}`);

        let leadImage: ImageInfo | null = null;
        if (frontmatter?.leadImage) {
          if (!this.lang) {
            leadImage = (await copyImage(
              buildConfig.repoPaths.easyedb,
              pathJoin(`chapter${chapterNo}`, frontmatter.leadImage),
              this.name,
              "[1024,920,720,meta]",
              this.logger
            )) as ImageInfo;
            leadImagesCache.set(chapterNo, leadImage);
          } else {
            leadImage = leadImagesCache.get(chapterNo) ?? null;
          }
        }

        const newChapter: BookChapter = {
          id: fileInfo.relname,
          chapterNo,
          chapterName,
          title,
          firstParagraph: tree.lookupAllChildren("paragraph")[0].getText(),
          document: content,
          headers,
          index,
          leadImage,
          tags:
            (frontmatter?.tags as string | undefined)
              ?.split(",")
              .map((t) => t.trim()) ?? [],
        };

        this.chapterStore.createNode(newChapter);

        break;
      }
      case "answers": {
        this.logger.info(`processing answers node: ${fileInfo.relname}`);

        const answers: QuizAnswers = {
          id: chapterNo.toString(),
          document: tree,
        };

        this.answerStore.createNode(answers);

        break;
      }
    }
  }

  extractMetadata(rootNode: XMLNode) {
    const titles = rootNode.lookupAllChildren("title");

    const titleNode = titles[0];

    if (!titleNode) {
      throw new Error("No chapter title found");
    }

    const [chapterName, title] = titleNode.getText().split("-");

    if (!title) {
      throw new Error(
        "Chapter title not in format: `${chapterName} - ${title}`"
      );
    }

    return {
      title: title.trim(),
      chapterName: chapterName.trim(),
    };
  }

  wrapBlock(rootNode: XMLNode, blockName: string, collectChildName?: string) {
    const rawNodes = rootNode.lookupAllChildren("raw");

    const blockStartNode = rawNodes.find((node) =>
      new RegExp(`^\\s*<!--\\s*${blockName}-start\\s*-->\\s*$`).test(
        node.getText()
      )
    );
    const blockEndNode = rawNodes.find((node) =>
      new RegExp(`^\\s*<!--\\s*${blockName}-end\\s*-->\\s*$`).test(
        node.getText()
      )
    );

    if (blockStartNode) {
      if (!blockEndNode) {
        throw new Error(`No closing comment for '${blockName}' block`);
      }

      let collectedChildNode: XMLNode | null = null;

      let node: XMLNode | undefined = blockStartNode;
      while (node && node !== blockEndNode) {
        if (collectChildName && node.name === collectChildName) {
          collectedChildNode = node;
        }

        node.parent!.removeTextChildrenFromIndex(node.childIndex! + 1);
        let nextNode = node.getNextSibling() as XMLNode | undefined;

        if (!nextNode) {
          node.parent!.parent!.removeTextChildrenFromIndex(
            node.parent!.childIndex! + 1
          );
          const nextParent = node.parent!.getNextSibling() as
            | XMLNode
            | undefined;

          nextParent?.removeTextChildrenFromIndex(0);
          nextNode = nextParent?.children[0] as XMLNode | undefined;
        }

        node.parent?.removeChild(node);
        node = nextNode;
      }

      if (node === blockEndNode) {
        if (collectChildName && !collectedChildNode) {
          throw new Error(
            `No '${collectChildName}' found in '${blockName}' block`
          );
        }

        const replacementNode = new XMLNode(blockName, {}, [
          collectedChildNode ?? "",
        ]);

        node.parent!.replaceChild(node, replacementNode);
      } else {
        throw new Error(`Closing comment for '${blockName}' block not found`);
      }
    }
  }

  makeIndex(
    node: XMLNode,
    relname: string
  ): {
    blocks: IndexBlock[];
  } {
    let blocks: IndexBlock[] = [];

    let chapterPath = relname.split("/")[0];
    if (chapterPath === "chapter0") {
      chapterPath = "";
    }

    const rootSectionNode = node.lookupChildren("section")[0];

    let sectionNodes = node.lookupAllChildren("section");
    for (let sectionNode of sectionNodes) {
      let target = null;
      if (sectionNode !== rootSectionNode) {
        if (!sectionNode.attrs.ids) {
          continue;
        }
        target = sectionNode.attrs.ids.split(/\s+/g)[0];
      }

      let type = "section";
      let name = null;

      let titleNode = sectionNode.lookupChild("title");
      if (!titleNode) {
        continue;
      }

      let title: string | null = titleNode
        .getAllText()
        .replace("Chapter 0", "Welcome");
      let summary = null;

      let firstPara = sectionNode.lookupChild("paragraph");
      if (firstPara) {
        summary = summarify(firstPara.getAllText());
      } else {
        // skip sections without a single paragraph.
        continue;
      }

      blocks.push({
        target,
        type,
        name,
        title,
        summary,
        content: sectionNode.getAllText(),
        relname: "/" + chapterPath,
      });
    }

    return {
      blocks,
    };
  }

  async createSearchIndex() {
    const nodes = this.chapterStore.getAllNodes();

    return buildSearchIndex(this, (builder) => {
      for (let node of nodes) {
        for (let block of node.index.blocks) {
          builder.addDocument(block);
        }
      }
    });
  }
}
