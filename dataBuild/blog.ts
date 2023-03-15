import {createHash} from "crypto";
import path from "path";

import fs from "fs-extra";
import RSS from "rss";

import {Pipeline, PipelineStep} from "@edgedb/site-build-tools";
import {NodeStore} from "@edgedb/site-build-tools/nodeStore";
import {
  createProcessSphinxXMLStep,
  createRunSphinxBuildStep,
  createWatchFilesStep,
  FileInfo,
  injectConfPy,
} from "@edgedb/site-build-tools/steps";
import {
  copyAsset,
  copyImage,
  getBuildDir,
  sortFirst,
  strToId,
  writeData,
} from "@edgedb/site-build-tools/utils";

import {transformXML, XMLNode} from "@edgedb/site-build-tools/xmlutils";

import {fetchGithubAPI} from "./utils";
import {BlogAuthor, BlogPost} from "./interfaces";
import {renderXML} from "./xmlRenderer";
import {blogRenderers} from "./xmlRenderer/blogRenderers";
import {intersphinxConfig} from "./intersphinx";

import buildConfig from "../build.config";

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export class BlogPipeline extends Pipeline {
  constructor() {
    super("blog", "cyan");
    this.processXMLFile = this.processXMLFile.bind(this);
  }

  async init() {}

  sourceDir = "content/blog";

  postStore = new NodeStore<BlogPost>();
  authorStore = new NodeStore<BlogAuthor>();

  xmlTreeCache = new Map<
    string,
    {
      tree: XMLNode;
      meta: UnwrapPromise<ReturnType<BlogPipeline["extractMeta"]>>;
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

    const confDir = path.join(getBuildDir(), "blog");

    return [
      createWatchFilesStep(this.sourceDir, undefined, cleanRemovedFiles),
      injectConfPy(confDir, null, {...intersphinxConfig}),
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
              this.relnameSlugMapping.set(fileInfo.relname, meta.slug!);
            })
          );
        }
      ),
      {
        onRun: async ({done, failed}) => {
          try {
            const posts = this.postStore.getAllNodes();

            const postsGuids = new Map<string, string>();
            for (const post of posts) {
              if (postsGuids.has(post.guid!)) {
                throw new Error(
                  `blog posts '${postsGuids.get(post.guid!)}' and '${
                    post.id
                  }' have the same guid ('${post.guid!}')`
                );
              }
              postsGuids.set(post.guid!, post.id!);
            }

            await Promise.all([
              writeData(
                {
                  authors: this.authorStore.getAllNodes(),
                  posts,
                },
                ["blog"],
                undefined,
                this.logger
              ),
              this.generateRSSFeed(),
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
    const {tree, meta} = this.xmlTreeCache.get(fileInfo.relname) ?? {};

    if (!tree || !meta) {
      throw new Error(`xml file '${fileInfo.path}' not in cache`);
    }

    if (!process.env.SHOW_DRAFT_BLOG_POSTS && meta.draft) {
      return;
    }

    this.logger.info(`processing blog node: ${fileInfo.relname}`);

    const blogLinks = tree
      .lookupAllChildren("reference")
      .filter(
        (ref) =>
          ref.attrs.internal?.toLowerCase() === "true" &&
          ref.attrs.refuri?.startsWith("../")
      );
    for (const blogLink of blogLinks) {
      const [refname, refid] = blogLink.attrs.refuri!.slice(3).split("#");
      const slug = this.relnameSlugMapping.get(refname);
      if (!slug) {
        throw new Error(
          `Failed to resolve refuri ${blogLink.attrs.refuri} into slug`
        );
      }
      blogLink.attrs.refuri = `/blog/${slug}${refid ? `#${refid}` : ""}`;
    }

    const {content, headers} = await renderXML(
      tree,
      {
        rootDir: this.sourceDir,
        logger: this.logger,
      },
      blogRenderers
    );

    const newPost: BlogPost = {
      id: fileInfo.relname,
      basename: fileInfo.relname.split("/").pop() ?? "",
      headers,
      document: content,
      authors: meta.authors,
      guid: meta.guid ?? undefined,
      localResources: meta.localResources,
    };

    const metaNames: (keyof BlogPost)[] = [
      "leadImage",
      "slug",
      "title",
      "publishedOn",
      "description",
    ];
    for (let metaName of metaNames) {
      if ((meta as any)[metaName] !== null) {
        newPost[metaName] = (meta as any)[metaName];
      }
    }

    this.postStore.createNode(newPost);
  }

  async extractMeta(node: XMLNode, isIndex: boolean) {
    let authors = [];
    let authorProfiles = [];
    let title = null;
    let description = null;
    let slug = null;
    let publishedOn = null;
    let leadImage = null;
    let localResources = null;
    let guid = null;
    let draft = false;

    const indexNodes = ["blog-author-profile"];
    const requiredNonIndexNodes = [
      "title",
      "blog-description",
      "blog-published-on",
      "blog-author",
      "blog-guid",
    ];
    const maxOnceNodes = [
      "blog-description",
      "blog-published-on",
      "blog-lead-image",
      "blog-guid",
      "blog-draft",
    ];

    const loadNodes = (tag: string) => {
      let nodes = node.lookupAllChildren(tag);
      if (isIndex) {
        if (nodes.length && !indexNodes.includes(tag)) {
          throw `"${tag}" directive must not be used in index`;
        }
      } else {
        if (indexNodes.includes(tag) && nodes.length) {
          throw `"${tag}" directive can only be used in index`;
        }
        if (requiredNonIndexNodes.includes(tag) && !nodes.length) {
          throw `missing required "${tag}" directive`;
        }
        if (maxOnceNodes.includes(tag) && nodes.length > 1) {
          throw `"${tag}" directive can only be specified once per file`;
        }
      }
      return nodes;
    };

    let titleNodes = loadNodes("title");
    let descriptionNodes = loadNodes("blog-description");
    let authorProfileNodes = loadNodes("blog-author-profile");
    let authorNodes = loadNodes("blog-author");
    let publishedOnNodes = loadNodes("blog-published-on");
    let guidNodes = loadNodes("blog-guid");
    let leadImgNodes = loadNodes("blog-lead-image");
    let localLinkNodes = loadNodes("blog-local-link");
    let draftNodes = loadNodes("blog-draft");

    if (isIndex) {
      const authorKeys = new Set<string>();
      for (let auth of authorProfileNodes) {
        if (!auth.attrs.key || authorKeys.has(auth.attrs.key)) {
          throw new Error(
            `blog:author-profile directive must contain unique key: ${auth.attrs.key}`
          );
        }
        authorKeys.add(auth.attrs.key);
        authorProfiles.push(auth.attrs);
      }
      authorProfiles = await Promise.all(
        authorProfiles.map((p) => this.createAuthorProfile(p))
      );
    } else {
      for (let auth of authorNodes) {
        let key = auth.getText().trim();
        let authId = authKeyToId(key);
        let authorNode = this.authorStore.getNode(authId);

        if (!authorNode) {
          throw `could not locate author with key=${key}`;
        }

        authors.push(authorNode);
      }

      title = titleNodes[0].getText().trim();
      slug = titleNodes[0].parent?.attrs.ids;

      draft = !!draftNodes.length;

      description = descriptionNodes[0].getText();

      publishedOn = new Date(publishedOnNodes[0].getText());
      guid = guidNodes[0].getText().trim();

      if (leadImgNodes.length) {
        leadImage = await copyImage(
          this.sourceDir,
          leadImgNodes[0].attrs.uri!,
          this.name,
          "[_,940,770,meta]",
          this.logger
        );
      }

      if (localLinkNodes.length) {
        let copiedPaths = new Set<string>();
        localResources = await Promise.all(
          localLinkNodes.map(async (node) => {
            if (copiedPaths.has(node.attrs.rel_path!)) {
              return;
            }
            copiedPaths.add(node.attrs.rel_path!);
            await copyAsset(
              this.sourceDir,
              node.attrs.rel_path!,
              this.name,
              "localResources",
              this.logger
            );
          })
        );
      }
    }

    return {
      authors,
      title,
      slug,
      publishedOn,
      leadImage,
      description,
      localResources,
      guid,
      draft,
    };
  }

  async createAuthorProfile(profile: any) {
    const id = authKeyToId(profile.key);

    let newNode: BlogAuthor = {
      id,
      key: profile.key,
      name: profile.name,
    };

    if (!profile.name) {
      throw new Error(`blog:author-profile must contain a 'name' attribute`);
    }

    const keys: (keyof BlogAuthor)[] = ["email", "twitter", "github"];
    for (let key of keys) {
      newNode[key] = profile[key] ?? null;
    }

    if (newNode.github) {
      const data = await fetchGithubAPI(`/users/${newNode.github}`);

      const avatarUrl = data?.avatar_url;

      if (!avatarUrl) {
        throw new Error(
          `Could not fetch avatar url from github api for username '${newNode.github}'`
        );
      }

      newNode.avatarUrl = `${avatarUrl}&s=72`;
    } else {
      if (!newNode.email) {
        throw new Error("Either github username or email required");
      }

      const md5 = createHash("md5");
      const emailHash = md5
        .update(newNode.email.trim().toLowerCase())
        .digest("hex");

      newNode.avatarUrl = `https://www.gravatar.com/avatar/${emailHash}?s=72&d=blank`;
    }

    this.authorStore.createNode(newNode);
    this.logger.info(`created node for author "${profile.key}"`);
    return this.authorStore.getNode(id);
  }

  async generateRSSFeed() {
    const feed = new RSS({
      title: "EdgeDB",
      description: "A new generation database",
      site_url: "https://edgedb.com",
      feed_url: "https://edgedb.com/rss.xml",
    });

    const posts = this.postStore
      .getAllNodes()
      .filter((post) => !!post)
      .sort(
        (a, b) =>
          new Date(b.publishedOn!).getTime() -
          new Date(a.publishedOn!).getTime()
      );

    for (const post of posts) {
      if (post.id !== "__index__") {
        feed.item({
          title: post.title!,
          date: post.publishedOn!,
          description: post.description!,
          url: `https://edgedb.com/blog/${post.slug}?ref=rss`,
          guid: post.guid,
        });
      }
    }

    this.logger.log(`Writing rss feed to 'public/rss.xml'`);
    await fs.writeFile("public/rss.xml", feed.xml({indent: true}));
  }
}

function authKeyToId(key: string) {
  return strToId(`author-profile:${key}`);
}
