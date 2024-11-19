import { XMLNode } from "@edgedb-site/build-tools/xmlutils";
import { renderers } from "./renderers";

export type EmbeddingsRenderer = (
  node: XMLNode,
  ctx: RenderMdContext,
  index?: number
) => string;

export type EmbeddingsRendererMap = {
  [key: string]: EmbeddingsRenderer | undefined;
};

interface RenderMdContext {
  renderers: EmbeddingsRendererMap;
  relname?: string;
  pageAttrs: Map<string, any>;
}

interface RenderMdOpts {
  relname?: string;
}

export function renderToMd(rootXMLNode: XMLNode, opts: RenderMdOpts) {
  const ctx: RenderMdContext = {
    renderers,
    ...opts,
    pageAttrs: new Map<string, any>(),
  };
  const sections: string[] = [];
  for (const sectionNode of rootXMLNode.lookupAllChildren("section")) {
    sections.push(renderNode(sectionNode, ctx).trim());
  }
  for (const descNode of rootXMLNode.lookupAllChildren("desc")) {
    sections.push(renderNode(descNode, ctx).trim());
  }

  return sections;
}

export function renderNode(
  node: XMLNode,
  ctx: RenderMdContext,
  index?: number
): string {
  const renderer = ctx.renderers[node.name];
  if (!renderer) {
    console.error("No renderer for node type: ", node.name);
    return "";
  }

  return renderer(node, { ...ctx }, index);
}

export function renderChildren(
  children: (string | XMLNode)[],
  ctx: RenderMdContext
): string {
  return children
    .map((child, index) =>
      typeof child === "string"
        ? child.replace(/\n|\s(?=\s)/g, "")
        : renderNode(child, ctx, Math.floor(index / 2) + 1)
    )
    .join("");
}
