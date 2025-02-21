import {
  PackedRenderNode,
  RenderComponentType,
} from "@edgedb-site/build-tools/xmlRenderer/interfaces";

export type { Header } from "@edgedb-site/build-tools/xmlRenderer";

import { baseRenderComponents } from "./baseComponents";

export type RenderComponentsMap = {
  [key in RenderComponentType]?: (
    renderNodes: (
      nodes: (PackedRenderNode | string)[]
    ) => (string | JSX.Element | null)[]
  ) => (props: any) => JSX.Element;
};

const componentCache = new WeakMap<
  any,
  { [key: number]: ((props: any) => JSX.Element) | undefined }
>();

export function renderDocument(
  node: PackedRenderNode,
  styles?: { readonly [key: string]: string },
  additionalRenderComponents?: RenderComponentsMap,
  reactComponents?: {
    [key: string]: undefined | (() => JSX.Element);
  },
  baseStyles?: { readonly [key: string]: string }
) {
  const renderComponents = {
    ...baseRenderComponents,
    ...(additionalRenderComponents ?? {}),
  };

  function renderNode(node: PackedRenderNode, key: number | string) {
    const [el, { styles: styleClasses, ...props }, children] = node;

    props.className = [
      ...(props.className ? [props.className] : []),
      ...(styleClasses ?? []).map(
        (style) =>
          (baseStyles?.[style] ? baseStyles[style] + " " : "") +
          (styles?.[style] ?? "")
      ),
    ].join(" ");

    if (el === RenderComponentType.ReactComponent) {
      const Component = reactComponents?.[props.component];
      if (!Component) {
        throw new Error(
          `Cannot find react component with name '${props.component}'`
        );
      }
      return <Component key={key} />;
    }

    let El: string | ((props: any) => JSX.Element) | undefined;
    if (typeof el === "string") {
      El = el;
    } else {
      if (!componentCache.has(additionalRenderComponents)) {
        componentCache.set(additionalRenderComponents, {});
      }
      if (!componentCache.get(additionalRenderComponents)![el]) {
        componentCache.get(additionalRenderComponents)![el] =
          renderComponents[el]?.(renderNodes);
      }
      El = componentCache.get(additionalRenderComponents)![el];
    }
    if (!El) {
      return null;
    }

    return (
      <El {...(props as any)} key={props.key ?? key}>
        {children.length ? renderNodes(children) : undefined}
      </El>
    );
  }

  function renderNodes(nodes: (PackedRenderNode | string)[]) {
    return nodes.map((childNode, i) =>
      typeof childNode === "string" ? childNode : renderNode(childNode, i)
    );
  }

  return renderNode(node, "documentRoot");
}
