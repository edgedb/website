import fs, {outputFile} from "fs-extra";
import {join as pathJoin} from "path";
import {Pipeline, PipelineStep} from "@edgedb-site/build-tools";
import {getBuildDir} from "@edgedb-site/build-tools/utils";
import {BlogPost, UpdatePost} from "./interfaces";

export class LatestInfoPipeline extends Pipeline {
  constructor() {
    super("latestInfo", "magenta");
  }

  async init() {}

  getSteps() {
    return [
      {
        onRun: async ({done, failed}) => {
          try {
            const [latestBlogPost, latestUpdate, latestEdgeDBVersion] =
              await Promise.all([
                fetchLatestBlogPostInfo(),
                fetchLatestUpdate(),
                fetchLatestEdgeDBVersion(),
              ]);

            const outputPath = pathJoin("./public", "latestInfo.json");
            this.logger.log(`Writing data to ${outputPath}`);
            await outputFile(
              outputPath,
              JSON.stringify({
                latestBlogPost,
                latestUpdate,
                latestEdgeDBVersion,
              })
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

async function fetchLatestBlogPostInfo() {
  const blogData = await fs.readJSON(pathJoin(getBuildDir(), "blog.json"));

  const latestPost = (blogData.posts as BlogPost[])
    .map((p) => ({
      ...p,
      timestamp: p.publishedOn ? new Date(p.publishedOn).getTime() : 0,
    }))
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  return {
    title: latestPost.title,
    url: `https://www.edgedb.com/blog/${latestPost.slug}`,
    publishedTimestamp: (latestPost as any).timestamp,
    imageUrl: `https://www.edgedb.com/${latestPost.leadImage!.path.replace(
      /^\//,
      ""
    )}${latestPost.leadImage!.pathIncludesExt ? "" : ".webp"}`,
    imageBrightness: latestPost.leadImage!.brightness! / 256,
  };
}

async function fetchLatestUpdate() {
  const updates = await fs.readJSON(pathJoin(getBuildDir(), "updates.json"));

  const latestUpdate = (updates.posts as UpdatePost[])
    .map((p) => ({
      ...p,
      timestamp: p.publishedOn ? new Date(p.publishedOn).getTime() : 0,
    }))
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  return {
    title: latestUpdate.title,
    url: `https://www.edgedb.com/updates`,
  };
}

async function fetchLatestEdgeDBVersion() {
  const res = await fetch(
    "https://packages.edgedb.com/archive/.jsonindexes/x86_64-unknown-linux-musl.json"
  );

  if (!res.ok) {
    throw new Error(
      "failed to fetch jsonindexes to find latest edgedb version"
    );
  }

  const data = (await res.json()) as {
    packages: {
      basename: string;
      version_details: {major: number; minor: number; patch: number | null};
    }[];
  };

  const latest = data.packages
    .filter(
      (ver) =>
        ver.basename === "edgedb-server" && ver.version_details.patch === null
    )
    .sort((a, b) =>
      a.version_details.major === b.version_details.major
        ? b.version_details.minor - a.version_details.minor
        : b.version_details.major - a.version_details.major
    )[0];

  return `${latest.version_details.major}.${latest.version_details.minor}`;
}
