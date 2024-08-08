import { PropsWithChildren } from "react";
import Link from "next/link";

import {
  PackedRenderNode,
  RenderComponentType,
} from "@edgedb-site/build-tools/xmlRenderer/interfaces";
import { RenderComponentsMap } from "./index";

import { Code, CodeProps, Migration } from "../components/code";
import { CodeTabs } from "../components/code/tabs";
import HeaderLink from "../components/headerLink";
import LazyImage from "../components/lazyImage";

export interface NextLinkProps {
  href: string;
  [key: string]: any;
}

export interface CodeTabsRenderProps {
  tabs: {
    name: string;
    lang: string;
    kind: "code" | "text";
    codeBlock: (string | PackedRenderNode)[];
  }[];
}

export interface CodeRenderProps extends Omit<CodeProps, "caption"> {
  caption?: (string | PackedRenderNode)[] | undefined;
}

export const baseRenderComponents: RenderComponentsMap = {
  [RenderComponentType.NextLink]: () => ({
    children,
    href,
    ...props
  }: PropsWithChildren<NextLinkProps>) => (
    <Link href={href} {...props}>
      {children}
    </Link>
  ),
  [RenderComponentType.Code]: (renderNodes) => ({ caption, ...props }) => (
    <Code {...props} caption={caption && renderNodes(caption)} />
  ),
  [RenderComponentType.CodeTabs]: (renderNodes) => ({
    tabs,
    ...props
  }: CodeTabsRenderProps) => {
    const tabsProp = tabs.map(({ name, lang, kind, codeBlock }) => ({
      name,
      lang,
      kind,
      codeBlock: <>{renderNodes(codeBlock)}</>,
    }));

    return <CodeTabs {...props} tabs={tabsProp} />;
  },
  // [RenderComponent.Migration]: () => Migration,
  [RenderComponentType.HeaderLink]: () => HeaderLink,
  [RenderComponentType.LazyImage]: () => LazyImage,
};
