import {XMLNode} from "@edgedb/site-build-tools/xmlutils";
import {renderNode, RenderXMLContext, XMLRendererMap} from ".";
import {RenderComponent, RenderNode} from "./interfaces";

export function createSimpleRenderers(mappings: {
  [key: string]: string;
}): XMLRendererMap {
  return Object.keys(mappings).reduce((renderers, key) => {
    renderers[key] = (node, ctx) => createElement(node, mappings[key], ctx);
    return renderers;
  }, {} as XMLRendererMap);
}

export const nullRenderer = async () => null;
export function createNullRenderers(names: string[]): XMLRendererMap {
  return names.reduce((renderers, name) => {
    renderers[name] = nullRenderer;
    return renderers;
  }, {} as XMLRendererMap);
}

export async function renderChildren(
  children: (XMLNode | string)[] | undefined | null,
  ctx: RenderXMLContext
): Promise<(string | RenderNode)[] | null> {
  if (!children) {
    return null;
  }

  const renderedChildren: (string | RenderNode)[] = [];
  for (const child of children) {
    if (typeof child === "string") {
      renderedChildren.push(child);
    } else {
      renderedChildren.push(...((await renderNode(child, ctx)) ?? []));
    }
  }
  return renderedChildren;
}

export async function createElement(
  node: XMLNode,
  type: string | RenderComponent,
  ctx: RenderXMLContext,
  props: any = {}
): Promise<RenderNode[]> {
  const [idProp, prefixCmps] = node.attrs.ids
    ? createIdAnchors(node.attrs.ids)
    : [];

  const el: RenderNode = {
    type,
    props: {
      ...props,
      id: idProp ?? props.id,
    },
    children: await renderChildren(node.children, ctx),
  };
  if (prefixCmps?.length) {
    return [...prefixCmps, el];
  }

  return [el];
}

export function createIdAnchors(idString: string): [string, RenderNode[]] {
  const ids = idString.split(" ");

  return [
    ids[0],
    ids.slice(1).map((id) => ({
      type: "div",
      props: {
        key: id,
        id: id,
      },
    })),
  ];
}

export function toAbsoluteURI(
  relativeURI: string,
  ctx: RenderXMLContext
): string {
  if (!ctx.relname) {
    return relativeURI;
  }

  let stack = ctx.relname.split("/"),
    parts = relativeURI.split("/");
  stack.pop();
  for (let part of parts) {
    if (part == ".") {
      continue;
    }

    if (part == "..") {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join("/");
}
