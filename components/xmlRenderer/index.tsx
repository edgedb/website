import {
  PackedRenderNode,
  RenderComponent,
} from "dataBuild/xmlRenderer/interfaces";

export type {Header} from "dataBuild/xmlRenderer";

import {baseRenderComponents} from "./baseComponents";

import baseStyles from "./base.module.scss";

export type RenderComponentsMap = {
  [key in RenderComponent]?: (
    renderNodes: (
      nodes: (PackedRenderNode | string)[]
    ) => (string | JSX.Element | null)[]
  ) => (props: any) => JSX.Element;
};

export function renderDocument(
  node: PackedRenderNode,
  styles?: {readonly [key: string]: string},
  additionalRenderComponents?: RenderComponentsMap,
  reactComponents?: {
    [key: string]: undefined | (() => JSX.Element);
  }
) {
  const renderComponents = {
    ...baseRenderComponents,
    ...(additionalRenderComponents ?? {}),
  };

  function renderNode(node: PackedRenderNode, key: number | string) {
    const [el, {styles: styleClasses, ...props}, children] = node;

    props.className = [
      ...(props.className ? [props.className] : []),
      ...(styleClasses ?? []).map(
        (style) =>
          (baseStyles[style] ? baseStyles[style] + " " : "") +
          (styles?.[style] ?? "")
      ),
    ].join(" ");

    function renderNodes(nodes: (PackedRenderNode | string)[]) {
      return nodes.map((childNode, i) =>
        typeof childNode === "string" ? childNode : renderNode(childNode, i)
      );
    }

    if (el === RenderComponent.ReactComponent) {
      const component = reactComponents?.[props.component];
      if (!component) {
        throw new Error(
          `Cannot find react component with name '${props.component}'`
        );
      }
      return component();
    }

    const El =
      typeof el === "string" ? el : renderComponents[el]?.(renderNodes);
    if (!El) {
      return null;
    }

    return (
      <El {...(props as any)} key={props.key ?? key}>
        {children.length ? renderNodes(children) : undefined}
      </El>
    );
  }

  return renderNode(node, "documentRoot");
}
