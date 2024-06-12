import { XMLNode } from "@edgedb-site/build-tools/xmlutils";
import { renderNode, RenderXMLContext, XMLRendererMap } from ".";
import { RenderNode } from "./interfaces";
import { RenderNodeConstructor } from "./renderNodes";
export * from "./remapLink";

export function createSimpleRenderers(mappings: {
  [key: string]: RenderNodeConstructor;
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
  constr: RenderNodeConstructor,
  ctx: RenderXMLContext,
  props: any = {}
): Promise<RenderNode[]> {
  const [idProp, prefixCmps] = node.attrs.ids
    ? createIdAnchors(node.attrs.ids)
    : [];

  if (typeof constr !== "function") {
    console.trace(constr);
  }

  const el = constr(
    {
      ...props,
      id: idProp ?? props.id,
    },
    ...((await renderChildren(node.children, ctx)) ?? [])
  );
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
