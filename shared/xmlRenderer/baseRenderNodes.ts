import { RenderComponentType } from "@edgedb-site/build-tools/xmlRenderer/interfaces";
import { buildRenderNode } from "@edgedb-site/build-tools/xmlRenderer/renderNodes";

import {
  NextLinkProps,
  CodeRenderProps,
  CodeTabsRenderProps,
} from "./baseComponents";

import type { HeaderLinkProps } from "../components/headerLink";
import type { LazyImageProps } from "../components/lazyImage";

export const NextLink = buildRenderNode<NextLinkProps>(
  RenderComponentType.NextLink
);

export const LazyImage = buildRenderNode<LazyImageProps>(
  RenderComponentType.LazyImage
);

export const HeaderLink = buildRenderNode<HeaderLinkProps>(
  RenderComponentType.HeaderLink
);

export const Code = buildRenderNode<CodeRenderProps>(RenderComponentType.Code);

export const CodeTabs = buildRenderNode<CodeTabsRenderProps>(
  RenderComponentType.CodeTabs
);
