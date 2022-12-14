import {Logger} from "@edgedb/site-build-tools/logger";
import {XMLNode} from "@edgedb/site-build-tools/xmlutils";
import {baseRenderers} from "./baseRenderers";

import {PackedRenderNode, RenderNode} from "./interfaces";

export interface Header {
  id: string;
  title: string;
  level: number;
}

export interface RenderXMLContext {
  readonly renderers: XMLRendererMap;
  readonly headers: Header[];
  sectionLevel: number;
  paragraphLevel: number;
  readonly rootDir: string;
  readonly relname?: string;
  readonly sourceUrl?: string;
  readonly lang?: string;
  readonly pageAttrs: Map<string, any>;
  readonly customData?: any;
  readonly logger: Logger;
}

export interface RenderXMLOpts {
  rootDir: string;
  relname?: string;
  sourceUrl?: string;
  lang?: string;
  customData?: any;
  logger: Logger;
}

export type XMLRenderer = (
  node: XMLNode,
  ctx: RenderXMLContext
) => Promise<(RenderNode | string)[] | null>;

export type XMLRendererMap = {[key: string]: XMLRenderer | undefined};

export async function renderXML(
  rootXMLNode: XMLNode,
  options: RenderXMLOpts,
  additionalRenderers: XMLRendererMap = {}
): Promise<{
  content: PackedRenderNode;
  headers: Header[];
}> {
  const renderers: XMLRendererMap = {
    ...baseRenderers,
    ...additionalRenderers,
  };

  const ctx: RenderXMLContext = {
    renderers,
    headers: [],
    sectionLevel: 0,
    paragraphLevel: 0,
    ...options,
    pageAttrs: new Map<string, any>(),
  };

  const content: RenderNode = {
    type: "div",
    props: {styles: ["rstWrapper"]},
    children: await renderNode(rootXMLNode, ctx),
  };

  return {
    content: packRenderNode(content),
    headers: ctx.headers,
  };
}

export async function renderNode(
  node: XMLNode,
  ctx: RenderXMLContext
): Promise<(RenderNode | string)[] | null> {
  const renderer = ctx.renderers[node.name];
  if (!renderer) {
    ctx.logger.error("No renderer for node type: ", node.name);
    return null;
  }

  return renderer(node, {...ctx});
}

export function packRenderNode(node: RenderNode): PackedRenderNode {
  return [node.type, node.props ?? {}, packRenderNodes(node.children)];
}

export function packRenderNodes(
  nodes: (RenderNode | string)[] | null | undefined
): (PackedRenderNode | string)[] {
  return (
    (nodes
      ?.map((child) =>
        typeof child === "string"
          ? child
          : child
          ? packRenderNode(child)
          : null
      )
      .filter((n) => n !== null) as (string | PackedRenderNode)[]) ?? []
  );
}
