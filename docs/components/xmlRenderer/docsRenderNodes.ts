import { RenderComponentType } from "@edgedb-site/build-tools/xmlRenderer/interfaces";
import { buildRenderNode } from "@edgedb-site/build-tools/xmlRenderer/renderNodes";

import { DescBlockProps, DescRefProps } from "@/components/descBlock";
import { DocIntroIllustrationProps } from "@/components/introIllustration";
import {
  VersionedBlockProps,
  VersionedLinkProps,
} from "@/components/versioned";
import { VersionedNoteProps } from "@/components/versionedNote";
import { VersionedCodeRenderProps } from "@/components/versioned/code";
import { VersionedHeaderLinkProps } from "@/components/versioned/headerLink";
import { VersionedContentReplaceRenderProps } from "@/components/versioned/replace";

export const DescBlock = buildRenderNode<DescBlockProps>(
  RenderComponentType.DescBlock
);
export const DocIntroIllustration = buildRenderNode<DocIntroIllustrationProps>(
  RenderComponentType.DocIntroIllustration
);
export const DescRef = buildRenderNode<DescRefProps>(
  RenderComponentType.DescRef
);
export const VersionedCode = buildRenderNode<VersionedCodeRenderProps>(
  RenderComponentType.VersionedCode
);
export const VersionedHeaderLink = buildRenderNode<VersionedHeaderLinkProps>(
  RenderComponentType.VersionedHeaderLink
);
export const VersionedBlock = buildRenderNode<VersionedBlockProps>(
  RenderComponentType.VersionedBlock
);
export const VersionedLink = buildRenderNode<VersionedLinkProps>(
  RenderComponentType.VersionedLink
);
export const VersionedNote = buildRenderNode<VersionedNoteProps>(
  RenderComponentType.VersionedNote
);
export const VersionedContentReplace =
  buildRenderNode<VersionedContentReplaceRenderProps>(
    RenderComponentType.VersionedContentReplace
  );
