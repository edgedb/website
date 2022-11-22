import {join as pathJoin} from "path";

import {Pipeline, PipelineStep} from "@edgedb/site-build-tools";
import {NodeStore} from "@edgedb/site-build-tools/nodeStore";
import {
  createCopyFilesStep,
  createProcessSphinxXMLStep,
  createRunSphinxBuildStep,
  createWatchFilesStep,
  FileInfo,
} from "@edgedb/site-build-tools/steps";
import {
  cleanBuildDir,
  getTempDir,
  sortFirst,
  writeData,
} from "@edgedb/site-build-tools/utils";

import {transformXML, XMLNode} from "@edgedb/site-build-tools/xmlutils";
import {buildSig} from "@edgedb/site-build-tools/sphinx/buildSig";
import {TocExtractor} from "@edgedb/site-build-tools/sphinx/toc";

import {buildGoDocs} from "./godocs";

import {DocsDocument, DocVersionsConfig, IndexBlock} from "./interfaces";
import {renderXML} from "./xmlRenderer";
import {docsRenderers} from "./xmlRenderer/docsRenderers";

import {buildSearchIndex, summarify} from "./utils";
import {checkoutBranch, checkWorkingDirClean} from "./git";

import buildConfig from "../build.config";

import docVersionsConfig from "../docVersions.config";
import {buildDartDocs} from "./dartdocs";

const INDEX_NODES = [
  "function",
  "operator",
  "constraint",
  "type",
  "class",
  "method",
];

const clientDocsMapping = {
  python: {
    pathPrefix: "clients/python",
    repo: "edgedb/edgedb-python",
    useRoot: false,
    navDisplayName: "Python",
  },
  js: {
    pathPrefix: "clients/js",
    repo: "edgedb/edgedb-js",
    useRoot: false,
    navDisplayName: "TypeScript / JS",
  },
  go: {
    pathPrefix: "clients/go",
    repo: "edgedb/edgedb-go",
    useRoot: true,
    navDisplayName: "Go",
  },
  dart: {
    pathPrefix: "clients/dart",
    repo: "edgedb/edgedb-dart",
    useRoot: true,
    navDisplayName: "Dart",
  },
  dotnet: {
    pathPrefix: "clients/dotnet",
    repo: "edgedb/edgedb-net",
    useRoot: false,
    navDisplayName: "Dotnet"
  }
};

let checkedOutClientDocs = false;

export class DocsPipeline extends Pipeline {
  constructor(public versionId: "dev" | string) {
    super("docs", "blue", `docs (${versionId})`);
    this.processXMLFile = this.processXMLFile.bind(this);
  }

  tmpDir?: string;
  async init() {
    if (this.watchMode && this.versionId !== "dev") {
      throw new Error("Cannot run in watch mode without dev docs version");
    }

    if (this.watchMode) {
      this.logger.info(
        "In watch mode so only building current checkout of docs"
      );
      await cleanBuildDir(["docs"]);
    } else {
      await checkWorkingDirClean(buildConfig.repoPaths.edgedb);

      if (!checkedOutClientDocs) {
        this.logger.log(
          `Checking out edgedb-js branch '` +
            `${docVersionsConfig.drivers.js.branch}'...`
        );
        await checkoutBranch(
          buildConfig.repoPaths.js,
          docVersionsConfig.drivers.js.branch
        );
        this.logger.log(
          `Checking out edgedb-python branch '` +
            `${docVersionsConfig.drivers.python.branch}'...`
        );
        await checkoutBranch(
          buildConfig.repoPaths.python,
          docVersionsConfig.drivers.python.branch
        );
        checkedOutClientDocs = true;
      }

      this.logger.log(`Building docs version ${this.versionId}`);

      const docVersion = docVersionsConfig.versions.find(
        (ver) => ver.id === this.versionId
      )!;

      this.logger.log(`Checking out edgedb branch '${docVersion.branch}'...`);
      checkoutBranch(buildConfig.repoPaths.edgedb, docVersion.branch);
    }

    this.tmpDir = await getTempDir();
  }

  docStore = new NodeStore<DocsDocument>();

  getSteps() {
    const cleanRemovedFiles = ({
      type,
      relname,
    }: {
      type: "unlink" | "add" | "change";
      relname: string;
    }) => {
      if (type === "unlink") {
        this.docStore.deleteNode(relname);
      }
    };

    return [
      createCopyFilesStep(
        pathJoin(buildConfig.repoPaths.edgedb, "docs"),
        this.tmpDir!,
        ["**/*"],
        cleanRemovedFiles
      ),
      [
        createCopyFilesStep(
          pathJoin(buildConfig.repoPaths.python, "docs"),
          pathJoin(this.tmpDir!, clientDocsMapping["python"].pathPrefix),
          "**/*.rst",
          cleanRemovedFiles
        ),
        createCopyFilesStep(
          pathJoin(buildConfig.repoPaths.js, "docs"),
          pathJoin(this.tmpDir!, clientDocsMapping["js"].pathPrefix),
          "**/*.rst",
          cleanRemovedFiles
        ),
        createCopyFilesStep(
          pathJoin(buildConfig.repoPaths.dotnet, "docs"),
          pathJoin(this.tmpDir!, clientDocsMapping["dotnet"].pathPrefix),
          "**/*.rst",
          cleanRemovedFiles
        ),
        createWatchFilesStep(
          buildConfig.repoPaths.go,
          "**/*.go",
          undefined,
          async () => {
            this.logger.log("building go docs...");
            await buildGoDocs(
              buildConfig.repoPaths.go,
              pathJoin(this.tmpDir!, clientDocsMapping["go"].pathPrefix)
            );
          }
        ),
        createWatchFilesStep(
          buildConfig.repoPaths.dart,
          "lib/**/*.dart",
          undefined,
          async () => {
            this.logger.log("building dart docs...");
            await buildDartDocs(
              buildConfig.repoPaths.dart,
              pathJoin(this.tmpDir!, clientDocsMapping["dart"].pathPrefix)
            );
          }
        ),
      ],
      createRunSphinxBuildStep({
        sourceDir: this.tmpDir!,
        sphinxPath: buildConfig.sphinxPath,
        extraArgs: ["-W", "-n"],
        extraEnv: {
          PYTHONPATH: buildConfig.repoPaths.edgedb,
        },
      }),
      createProcessSphinxXMLStep(
        this.processXMLFile,
        sortFirst((change) => change.relname === "index")
      ),
      {
        onRun: async ({done, failed}) => {
          try {
            const index = await this.createSearchIndex();

            const allDocNodes = this.docStore.getAllNodes();

            const indexDocMetadata = allDocNodes.find(
              (doc) => doc.id === "index"
            )?.metadata;

            if (!indexDocMetadata) {
              throw new Error("No index page metadata");
            }
            const docsNavData = JSON.parse(indexDocMetadata).toc;
            if (!docsNavData) {
              throw new Error("No docs ToC found");
            }

            for (let node of docsNavData) {
              const childMeta = allDocNodes.find((doc) => doc.id === node.uri)
                ?.metadata;
              if (childMeta) {
                const introPage = JSON.parse(childMeta)["intro-page"];
                if (introPage) {
                  node["introPage"] = introPage;
                }
              }
              if (node.uri === "clients/index") {
                for (const clientNode of node.children) {
                  const navName = Object.values(clientDocsMapping).find(
                    (item) => clientNode.uri === `${item.pathPrefix}/index`
                  )?.navDisplayName;
                  clientNode.title = navName ?? clientNode.title;
                }
              }
            }

            const dataRoot = ["docs", this.versionId];

            await Promise.all([
              writeData(
                index,
                [...dataRoot, "docsearch"],
                ".jolrindex",
                this.logger,
                true
              ),
              writeData(
                docsNavData,
                [...dataRoot, "nav"],
                undefined,
                this.logger
              ),
              writeData(
                this.docStore.getAllNodes(),
                [...dataRoot, "data"],
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

  async processXMLFile(file: string, fileInfo: FileInfo) {
    const isIndex = fileInfo.relname === "index";

    const tree = transformXML(file);

    const meta = await this.extractMeta(tree, isIndex);
    const index = isIndex ? null : this.makeIndex(tree, fileInfo.relname);

    this.logger.info(`processing document node: ${fileInfo.relname}`);

    const {content, headers} = await renderXML(
      tree,
      {
        rootDir: this.tmpDir!,
        relname: "/docs/" + fileInfo.relname,
        sourceUrl: this.resolveSourceUrl(fileInfo.relname),
        logger: this.logger,
      },
      docsRenderers
    );

    let newDocNode: DocsDocument = {
      id: fileInfo.relname,
      metadata: JSON.stringify(meta.data),
      index: index ?? undefined,
      headers,
      document: content,
    };

    const metaNames: (keyof DocsDocument)[] = ["title"];
    for (let metaName of metaNames) {
      if ((meta as any)[metaName]) {
        newDocNode[metaName] = (meta as any)[metaName];
      }
    }
    this.docStore.createNode(newDocNode);
  }

  resolveSourceUrl(relname: string): string {
    let repo = "edgedb/edgedb";
    let branch =
      this.versionId === "dev"
        ? "master"
        : docVersionsConfig.versions.find((ver) => ver.id === this.versionId)
            ?.branch ?? "master";

    for (const [id, {pathPrefix, repo: clientRepo, useRoot}] of Object.entries(
      clientDocsMapping
    )) {
      if (relname.startsWith(pathPrefix)) {
        relname = useRoot ? "" : relname.slice(pathPrefix.length + 1);
        repo = clientRepo;
        branch =
          docVersionsConfig.drivers[id as keyof DocVersionsConfig["drivers"]]
            ?.branch ?? "master";
        break;
      }
    }

    let sourceUrl = `https://github.com/${repo}`;

    if (!relname) {
      return sourceUrl;
    }

    sourceUrl += `/blob/${branch}/docs/${relname}.rst`;

    return sourceUrl;
  }

  makeIndex(
    node: XMLNode,
    relname: string
  ): {
    indexBoost?: number;
    blocks: IndexBlock[];
  } | null {
    if (relname.indexOf("__toc__") >= 0) {
      return null;
    }

    const indexBoost = parseFloat(
      node
        .lookupAllChildren("container")
        .find((node) => node.attrs["index-boost"])?.attrs["index-boost"] ?? ""
    );

    let getIndexField = (node: XMLNode) => {
      let fields = null;

      if (node.name == "section") {
        let fieldListNode = node.lookupChild("field_list");
        if (!fieldListNode) {
          return null;
        }
        fields = fieldListNode.lookupAllChildren("field");
      } else if (node.name == "desc") {
        let descContentNode = node.lookupChild("desc_content");
        let fieldListNode = descContentNode?.lookupChild("field_list");
        if (!fieldListNode) {
          return null;
        }

        fields = fieldListNode.lookupAllChildren("field");
      }

      if (!fields?.length) {
        return null;
      }

      for (let fieldNode of fields) {
        if (
          fieldNode.attrs["eql-name"] == "index" ||
          fieldNode.lookupChild("field_name")?.getText() == "index"
        ) {
          let fieldBodyNode = fieldNode.lookupChild("field_body");
          return fieldBodyNode?.getAllText().trim();
        }
      }

      return null;
    };

    let blocks: IndexBlock[] = [];

    let sectionNodes = node.lookupAllChildren("section");
    for (let sectionNode of sectionNodes) {
      let target = null;
      if (!sectionNode.attrs.ids) {
        continue;
      }
      target = sectionNode.attrs.ids.split(/\s+/g)[0];

      let type = "section";
      let name = null;

      let titleNode = sectionNode.lookupChild("title");
      if (!titleNode) {
        continue;
      }

      let title: string | null = titleNode.getAllText();
      let index = getIndexField(sectionNode);
      let summary = null;

      if (sectionNode.attrs["eql-statement"]) {
        type = "statement";
        name = title;
        title = null;
        summary = sectionNode.attrs["summary"];
      } else {
        let firstPara = sectionNode.lookupChild("paragraph");
        if (firstPara) {
          summary = summarify(firstPara.getAllText());
        } else {
          // skip sections without a single paragraph.
          continue;
        }
      }

      blocks.push({
        target,
        type,
        name,
        title,
        summary,
        index,
        content: sectionNode.getAllText(),
        relname: relname,
      });
    }

    let defItems = node.lookupAllChildren("definition_list_item");
    for (let defNode of defItems) {
      let term = defNode.lookupChild("term");
      let def = defNode.lookupChild("definition");

      let target = null;
      if (term?.attrs.ids) {
        target = term.attrs.ids.split(/\s+/g)[0];
      }

      if (!target) {
        continue;
      }

      blocks.push({
        target: target,
        type: "definition",
        title: term?.getAllText(),
        summary: summarify(def?.getAllText() ?? ""),
        content: def?.getAllText(),
        relname: relname,
      });
    }

    let descs = node.lookupAllChildren("desc");
    for (let desc of descs) {
      let sig = desc.lookupChild("desc_signature");

      if (
        !desc.attrs.desctype ||
        INDEX_NODES.indexOf(desc.attrs.desctype) < 0 ||
        !sig
      ) {
        this.logger.warn(
          "not indexing <desc desctype=" + desc.attrs.desctype + "> node"
        );
        continue;
      }

      let target = null;
      if (sig.attrs.ids) {
        target = sig.attrs.ids.split(/\s+/g)[0];
      }

      let summary = desc.attrs.summary;
      if (!summary) {
        let firstPara = desc
          .lookupChild("desc_content")
          ?.lookupChild("paragraph");
        if (firstPara) {
          summary = summarify(firstPara.getAllText());
        } else {
          // skip sections without a single paragraph.
          continue;
        }
      }

      let signature = sig.attrs["eql-signature"];
      if (!signature && !sig.attrs["eql-name"]) {
        const {objtype, domain} = desc.attrs;
        [signature] = buildSig(objtype!, domain!, sig);
      }

      blocks.push({
        target: target,
        type: desc.attrs.desctype,
        name: sig.attrs["eql-name"],
        signature: signature || null,
        summary: summary,
        relname: relname,
        index: getIndexField(desc),
      });
    }

    return {
      indexBoost: Number.isNaN(indexBoost) ? undefined : indexBoost,
      blocks,
    };
  }

  async extractMeta(node: XMLNode, isIndex: boolean) {
    let titleNodes = node.lookupAllChildren("title");

    let title = "";
    let slug: string | undefined = "";
    if (titleNodes && titleNodes.length) {
      const altTitle = titleNodes[0].attrs["edb-alt-title"];
      title = altTitle || titleNodes[0].getText().trim();
      slug = titleNodes[0].parent?.attrs.ids;
    }

    let data: {[key: string]: any} = {};
    if (isIndex) {
      data["toc"] = TocExtractor.extract(node);
    }

    for (let cnt of node.lookupChildren("container")) {
      if (cnt.attrs["section-intro-page"]) {
        data["intro-page"] = cnt.attrs["section-intro-page"];
      }
    }

    return {title, slug, data};
  }

  async createSearchIndex() {
    const nodes = this.docStore.getAllNodes();

    const indexBoosts = nodes.reduce((boosts, node) => {
      if (node.index?.indexBoost !== undefined) {
        const relpath = node.id.split("/");
        if (relpath[relpath.length - 1] === "index") {
          relpath.pop();
        }
        boosts.push({
          relpath: relpath.join("/"),
          depth: relpath.length,
          boost: node.index.indexBoost,
        });
      }
      return boosts;
    }, [] as {relpath: string; depth: number; boost: number}[]);

    return buildSearchIndex(this, (builder) => {
      for (let node of nodes) {
        if (!node.index) {
          continue;
        }

        const {blocks} = node.index;
        let docBoost = 1;
        let boostDepth = 0;
        for (const {relpath, depth, boost} of indexBoosts) {
          if (depth > boostDepth && node.id.startsWith(relpath)) {
            docBoost = boost;
          }
        }

        for (let block of blocks) {
          builder.addDocument(block, docBoost);
        }
      }
    });
  }
}
