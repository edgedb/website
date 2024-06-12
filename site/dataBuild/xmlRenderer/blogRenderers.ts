import fs from "fs-extra";
import {join as pathJoin} from "path";
import {
  XMLRendererMap,
  packRenderNodes,
} from "@edgedb-site/build-tools/xmlRenderer";
import {
  containerRenderer,
  makeImageRenderer,
  titleRenderer,
} from "@edgedb-site/build-tools/xmlRenderer/baseRenderers";
import {
  createElement,
  createNullRenderers,
  renderChildren,
} from "@edgedb-site/build-tools/xmlRenderer/utils";
import {copyImage} from "@edgedb-site/build-tools/utils";

import {nodes as $} from "@edgedb-site/build-tools/xmlRenderer/renderNodes";
import {
  BlogChart,
  BlogGallery,
  BlogLocalLink,
  GithubButton,
} from "../../components/xmlRenderer/blogRenderNodes";

export const blogRenderers: XMLRendererMap = {
  title: async (node, ctx) => {
    if (ctx.sectionLevel === 1) {
      // Don't render the h1; we render it manually in another place
      return null;
    }

    return titleRenderer(node, ctx);
  },
  figure: async (node, ctx) => {
    return createElement(node, $.figure, ctx);
  },
  image: makeImageRenderer("blog", [940, 770]),
  caption: async (node, ctx) => {
    return createElement(node, $.figcaption, ctx);
  },
  raw: async (node, ctx) => {
    if (node.attrs.format === "html") {
      return [
        $.div({
          dangerouslySetInnerHTML: {__html: node.getText()},
        }),
      ];
    } else {
      return [$.div({}, $.pre({}, node.getText()))];
    }
  },
  container: async (node, ctx) => {
    if (node.attrs["image-gallery"]) {
      const itemNodes = node.children_no_text.filter(
        (node) =>
          node.name === "figure" ||
          (node.name === "container" && node.attrs["youtube-video-id"])
      );
      if (itemNodes.length !== node.children_no_text.length) {
        throw new Error(
          `blog:gallery directive may only contain 'figure' or ` +
            `'edb:youtube-embed' directives`
        );
      }
      const itemsData = await Promise.all(
        itemNodes.map(async (node) => {
          if (node.name === "figure") {
            const imgNode = node.lookupChild("image");
            const titleNode = node.lookupChild("caption");
            const captionNode = node.lookupChild("legend");
            if (!imgNode) {
              throw new Error("no image node found in figure node");
            }
            if (!titleNode) {
              throw new Error("no title found for gallery item");
            }

            const imgPath = pathJoin(ctx.rootDir, imgNode.attrs.uri!);
            if (await fs.pathExists(imgPath)) {
              const img = await copyImage(
                ctx.rootDir,
                imgNode.attrs.uri!,
                "blog-gallery",
                `[940,1440]`,
                ctx.logger
              );

              if (!img) {
                throw new Error(
                  `Image data for image node not found (uri: ${imgNode.attrs.uri})`
                );
              }

              return {
                type: "image",
                data: {
                  url: img.path,
                  thumbnail: img.thumbnail,
                  alt: imgNode.attrs["alt"],
                },
                aspectRatio: img.width / img.height,
                title: await renderChildren(titleNode.children, ctx),
                caption: captionNode
                  ? await renderChildren(captionNode.children, ctx)
                  : null,
              };
            } else {
              throw new Error(`Image path ${imgPath} does not exist`);
            }
          } else {
            const [titleNode, ...captionNodes] = node.children_no_text;
            if (!titleNode) {
              throw new Error("no title found for gallery item");
            }

            return {
              type: "youtube",
              data: {
                videoId: node.attrs["youtube-video-id"],
              },
              aspectRatio: 1 / 0.5625,
              title: await renderChildren(titleNode.children, ctx),
              caption: captionNodes
                ? await renderChildren(captionNodes, ctx)
                : null,
            };
          }
        })
      );

      const aspectRatio = Math.min(
        ...itemsData.map((item) => item.aspectRatio)
      );

      return [
        BlogGallery({
          aspectRatio,
          items: itemsData.map(({title, caption, ...rest}) => ({
            ...rest,
            title: packRenderNodes(title),
            caption: caption ? packRenderNodes(caption) : null,
          })) as any[],
        }),
      ];
    }

    return containerRenderer(node, ctx);
  },
  "blog-local-link": async (node, ctx) => {
    return [
      BlogLocalLink({
        relPath: node.attrs.rel_path!,
        text: node.attrs.title!,
      }),
    ];
  },
  "blog-chart": async (node, ctx) => {
    return [
      BlogChart({
        chartName: node.attrs.cmp!,
        props: JSON.parse(node.attrs.data ?? "{}"),
      }),
    ];
  },
  "github-button": async (node, ctx) => {
    return [GithubButton(node.attrs as any)];
  },
  // @ts-ignore
  strike: async (node, ctx) => {
    return [$.s({}, node.attrs["text"]!)];
  },
  ...createNullRenderers([
    "blog-author",
    "blog-author-profile",
    "blog-published-on",
    "blog-lead-image",
    "blog-lead-image-alt",
    "blog-lead-youtube",
    "blog-description",
    "blog-recommendation",
    "blog-guid",
  ]),
};
