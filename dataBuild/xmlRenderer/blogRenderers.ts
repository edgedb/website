import {XMLRendererMap} from ".";
import {makeImageRenderer, titleRenderer} from "./baseRenderers";
import {RenderComponent} from "./interfaces";
import {createElement, createNullRenderers} from "./utils";

export const blogRenderers: XMLRendererMap = {
  title: async (node, ctx) => {
    if (ctx.sectionLevel === 1) {
      // Don't render the h1; we render it manually in another place
      return null;
    }

    return titleRenderer(node, ctx);
  },
  figure: async (node, ctx) => {
    return createElement(node, "figure", ctx);
  },
  image: makeImageRenderer("blog", [940, 770]),
  caption: async (node, ctx) => {
    return createElement(node, "figcaption", ctx);
  },
  raw: async (node, ctx) => {
    if (node.attrs.format === "html") {
      return [
        {
          type: "div",
          props: {
            dangerouslySetInnerHTML: {__html: node.getText()},
          },
        },
      ];
    } else {
      return [
        {
          type: "div",
          children: [
            {
              type: "pre",
              children: [node.getText()],
            },
          ],
        },
      ];
    }
  },
  "blog-local-link": async (node, ctx) => {
    return [
      {
        type: RenderComponent.BlogLocalLink,
        props: {
          relPath: node.attrs.rel_path!,
          text: node.attrs.title!,
        },
      },
    ];
  },
  "blog-chart": async (node, ctx) => {
    return [
      {
        type: RenderComponent.BlogChart,
        props: {
          chartName: node.attrs.cmp!,
          props: JSON.parse(node.attrs.data ?? "{}"),
        },
      },
    ];
  },
  "github-button": async (node, ctx) => {
    return [
      {
        type: RenderComponent.GithubButton,
        props: node.attrs as any,
      },
    ];
  },
  ...createNullRenderers([
    "blog-author",
    "blog-published-on",
    "blog-lead-image",
    "blog-description",
    "blog-guid",
  ]),
};
