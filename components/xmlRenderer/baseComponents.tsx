import {PropsWithChildren} from "react";
import Link from "next/link";

import {
  PackedRenderNode,
  RenderComponent,
} from "dataBuild/xmlRenderer/interfaces";
import {RenderComponentsMap} from ".";

import {Code, CodeProps, Migration} from "@/components/code";
import {CodeTabs} from "@/components/code/tabs";
import HeaderLink from "@/components/headerLink";
import LazyImage from "@/components/lazyImage";

export const baseRenderComponents: RenderComponentsMap = {
  [RenderComponent.NextLink]: () => NextLink,
  [RenderComponent.Code]: (renderNodes) => ({caption, ...props}) => (
    <Code {...props} caption={caption && renderNodes(caption)} />
  ),
  [RenderComponent.CodeTabs]: (renderNodes) => ({
    tabs,
    ...props
  }: CodeTabsRenderProps) => {
    const tabsProp = tabs.map(({name, lang, kind, codeBlock}) => ({
      name,
      lang,
      kind,
      codeBlock: <>{renderNodes(codeBlock)}</>,
    }));

    return <CodeTabs {...props} tabs={tabsProp} />;
  },
  [RenderComponent.Migration]: () => Migration,
  [RenderComponent.HeaderLink]: () => HeaderLink,
  [RenderComponent.LazyImage]: () => LazyImage,
};

export interface NextLinkProps {
  href: string;
  [key: string]: any;
}

// Wraps the next/link component to render correctly
function NextLink({
  children,
  href,
  ...props
}: PropsWithChildren<NextLinkProps>) {
  return (
    <Link href={href}>
      <a {...props}>{children}</a>
    </Link>
  );
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
