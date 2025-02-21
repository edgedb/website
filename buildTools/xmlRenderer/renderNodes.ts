import { RenderComponentType, RenderNode, WithStyles } from "./interfaces";

export const nodes = buildBasicRenderNodes(
  "a",
  "aside",
  "b",
  "code",
  "dd",
  "details",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "h2",
  "h3",
  "h4",
  "h5",
  "iframe",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "section",
  "span",
  "strong",
  "summary",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul"
);

export type RenderNodeConstructor<
  Props extends object = {
    [key: string]: any;
  }
> = (
  props: Props & WithStyles,
  ...children: (RenderNode | string)[]
) => RenderNode;

function buildBasicRenderNodes<Key extends string>(
  ...keys: Key[]
): {
  [key in Key]: RenderNodeConstructor;
} {
  const nodes = {} as any;
  for (const key of keys) {
    nodes[key] = (
      props: {
        [key: string]: any;
      } & WithStyles,
      ...children: (RenderNode | string)[]
    ) => ({ type: key, props, children });
  }
  return nodes;
}

export function buildRenderNode<Props extends object>(
  type: RenderComponentType
): RenderNodeConstructor<Props & { key?: string }> {
  return (props, ...children) => ({ type, props, children });
}

export const ReactComponent = (component: string) =>
  ({
    type: RenderComponentType.ReactComponent,
    props: {
      component,
    },
  } as RenderNode);
