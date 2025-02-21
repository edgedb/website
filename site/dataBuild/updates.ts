import path from "path";

import {Pipeline, PipelineStep} from "@edgedb-site/build-tools";
import {NodeStore} from "@edgedb-site/build-tools/nodeStore";
import {
  createProcessSphinxXMLStep,
  createRunSphinxBuildStep,
  createWatchFilesStep,
  FileInfo,
  injectConfPy,
} from "@edgedb-site/build-tools/steps";
import {
  getBuildDir,
  sortFirst,
  writeData,
} from "@edgedb-site/build-tools/utils";
import {transformXML, XMLNode} from "@edgedb-site/build-tools/xmlutils";
import {XMLRendererMap, renderXML} from "@edgedb-site/build-tools/xmlRenderer";
import {blogRenderers} from "./xmlRenderer/blogRenderers";
import {getIntersphinxConfig} from "./intersphinx";
import {UpdatePost} from "./interfaces";
import buildConfig from "../../build.config";
import {createElement} from "@edgedb-site/build-tools/xmlRenderer/utils";
import {nodes as $} from "@edgedb-site/build-tools/xmlRenderer/renderNodes";

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

const updateRenderers: XMLRendererMap = {
  ...blogRenderers,
  title: async (node, ctx) => {
    if (ctx.sectionLevel === 1) {
      return null;
    }

    const level = Math.min(ctx.sectionLevel, 5) as 2 | 3 | 4 | 5;
    const Header = `h${level || 1}` as const;

    return createElement(node, $[`${Header}`], ctx);
  },
};

export class UpdatesPipeline extends Pipeline {
  constructor() {
    super("updates", "cyan");
    this.processXMLFile = this.processXMLFile.bind(this);
  }

  async init() {}

  sourceDir = "content/updates";

  postStore = new NodeStore<UpdatePost>();

  xmlTreeCache = new Map<
    string,
    {
      tree: XMLNode;
      meta: UnwrapPromise<ReturnType<UpdatesPipeline["extractMeta"]>>;
    }
  >();
  relnameSlugMapping = new Map<string, string>();

  getSteps() {
    const cleanRemovedFiles = async ({
      type,
      relname,
    }: {
      type: "unlink" | "add" | "change";
      relname: string;
    }) => {
      if (type === "unlink") {
        this.postStore.deleteNode(relname);
      }
    };

    const confDir = path.join(getBuildDir(), "updates");

    return [
      createWatchFilesStep(this.sourceDir, undefined, cleanRemovedFiles),
      injectConfPy(confDir, null, async () => ({
        ...(await getIntersphinxConfig()),
      })),
      createRunSphinxBuildStep({
        sourceDir: this.sourceDir,
        indexFile: "__index__",
        sphinxPath: buildConfig.sphinxPath,
        extraArgs: ["-vvvv", "-W", "-n", "-c", confDir],
        extraExtensions: [
          "edgedbsite.sphinx_blogext",
          "edb.tools.docs",
          "sphinx.ext.intersphinx",
          "sphinx_code_tabs",
        ],
        extraEnv: {
          PYTHONPATH: buildConfig.repoPaths.edgedb,
        },
      }),
      createProcessSphinxXMLStep(
        this.processXMLFile,
        sortFirst((change) => change.relname === "__index__"),
        async (changes) => {
          await Promise.all(
            changes.map(async ({file, fileInfo}) => {
              const tree = transformXML(file);
              const meta = await this.extractMeta(
                tree,
                fileInfo.relname === "__index__"
              );
              this.xmlTreeCache.set(fileInfo.relname, {tree: tree, meta});
            })
          );
        }
      ),
      {
        onRun: async ({done, failed}) => {
          try {
            const posts = this.postStore.getAllNodes();

            const postDates = new Set<string>();
            for (const post of posts) {
              if (postDates.has(post.publishedOn!)) {
                throw new Error(
                  `Update post with title ${post.title} has published-on date ${post.publishedOn} that is already used by another post.
                  }`
                );
              }
              postDates.add(post.publishedOn!);
            }

            await Promise.all([
              writeData(
                {
                  posts,
                },
                ["updates"],
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

  async processXMLFile(_: string, fileInfo: FileInfo) {
    const {tree, meta} = this.xmlTreeCache.get(fileInfo.relname) ?? {};

    if (!tree || !meta) {
      throw new Error(`xml file '${fileInfo.path}' not in cache`);
    }

    this.logger.info(`processing update post node: ${fileInfo.relname}`);

    const {content} = await renderXML(
      tree,
      {
        rootDir: this.sourceDir,
        logger: this.logger,
      },
      updateRenderers
    );

    const newPost: UpdatePost = {
      id: fileInfo.relname,
      basename: fileInfo.relname.split("/").pop() ?? "",
      document: content,
    };

    const metaNames: (keyof UpdatePost)[] = ["title", "publishedOn"];
    for (let metaName of metaNames) {
      if ((meta as any)[metaName] !== null) {
        newPost[metaName] = (meta as any)[metaName];
      }
    }

    this.postStore.createNode(newPost);
  }

  async extractMeta(node: XMLNode, isIndex: boolean) {
    let title = null;
    let publishedOn = null;

    let titleNodes = node.lookupAllChildren("title");
    let publishedOnNodes = node.lookupAllChildren("blog-published-on");

    if (!isIndex) {
      title = titleNodes[0].getText().trim();
      publishedOn = new Date(publishedOnNodes[0].getText());
    }

    return {
      title,
      publishedOn,
    };
  }
}
