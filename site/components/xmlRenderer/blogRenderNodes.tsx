import {RenderComponentType} from "@edgedb-site/build-tools/xmlRenderer/interfaces";
import {buildRenderNode} from "@edgedb-site/build-tools/xmlRenderer/renderNodes";

import {
  BlogChartProps,
  BlogGalleryRenderProps,
  BlogLocalLinkProps,
  GithubButtonProps,
} from "./blogComponents";

export const BlogLocalLink = buildRenderNode<BlogLocalLinkProps>(
  RenderComponentType.BlogLocalLink
);
export const BlogChart = buildRenderNode<BlogChartProps>(
  RenderComponentType.BlogChart
);
export const GithubButton = buildRenderNode<GithubButtonProps>(
  RenderComponentType.GithubButton
);
export const BlogGallery = buildRenderNode<BlogGalleryRenderProps>(
  RenderComponentType.BlogGallery
);
