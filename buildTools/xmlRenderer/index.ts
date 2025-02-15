import { Logger } from "@edgedb-site/build-tools/logger";
import { XMLNode } from "@edgedb-site/build-tools/xmlutils";
import { baseRenderers } from "./baseRenderers";
import type { LinkRemapping } from "./remapLink";

import { PackedRenderNode, RenderNode } from "./interfaces";

export interface Header {
  id: string;
  title: string;
  level: number;
  versionAdded?: string;
}

export interface RenderXMLContext {
  readonly renderers: XMLRendererMap;
  readonly headers: Header[];
  sectionLevel: number;
  paragraphLevel: number;
  readonly rootDir: string;
  readonly relname?: string;
  readonly linkRemapping?: LinkRemapping;
  readonly sourceUrl?: string;
  readonly lang?: string;
  readonly linkVersionMapping?: Map<string, string>;
  readonly pageAttrs: Map<string, any>;
  readonly customData?: any;
  readonly logger: Logger;
  readonly seenLiteralBlockNodes: Set<XMLNode>;
  readonly ignoreCodeblockCaption?: boolean;
  readonly showExternalLinkIcons?: boolean;
  readonly emptyIndexPages?: Set<string>;
  readonly baseUrl: [string, RegExp];
}

export interface RenderXMLOpts {
  rootDir: string;
  relname?: string;
  linkRemapping?: LinkRemapping;
  sourceUrl?: string;
  lang?: string;
  linkVersionMapping?: Map<string, string>;
  customData?: any;
  logger: Logger;
  showExternalLinkIcons?: boolean;
  emptyIndexPages?: Set<string>;
  baseUrl?: [string, RegExp];
}

export type XMLRenderer = (
  node: XMLNode,
  ctx: RenderXMLContext
) => Promise<(RenderNode | string)[] | null>;

export type XMLRendererMap = { [key: string]: XMLRenderer | undefined };

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
    seenLiteralBlockNodes: new Set<XMLNode>(),
    baseUrl: options.baseUrl ?? [
      "https://www.edgedb.com",
      /^(?:www\.)?edgedb\.com$/,
    ],
  };

  const content: RenderNode = {
    type: "div",
    props: { styles: ["rstWrapper"] },
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

  return renderer(node, { ...ctx });
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
        typeof child === "string" ? child : child ? packRenderNode(child) : null
      )
      .filter((n) => n !== null) as (string | PackedRenderNode)[]) ?? []
  );
}
