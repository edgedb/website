import { RenderComponentType } from "@edgedb-site/build-tools/xmlRenderer/interfaces";
import { RenderComponentsMap } from "@edgedb-site/shared/xmlRenderer";

import DescBlock, { DescRef } from "@/components/descBlock";
// import DocsNavTable from "@/components/docsNavTable";
import DocIntroIllustration from "@/components/introIllustration";
import { VersionedBlock, VersionedLink } from "@/components/versioned";
import VersionedNote from "@/components/versionedNote";
import { VersionedCode } from "@/components/versioned/code";
import VersionedHeaderLink from "@/components/versioned/headerLink";
import { VersionedContentReplace } from "../versioned/replace";

export const docsRenderComponents: RenderComponentsMap = {
  [RenderComponentType.VersionedCode]:
    (renderNodes) =>
    ({ caption, ...props }) =>
      <VersionedCode {...props} caption={caption && renderNodes(caption)} />,
  [RenderComponentType.DescBlock]: () => DescBlock,
  [RenderComponentType.DocIntroIllustration]: () => DocIntroIllustration,
  [RenderComponentType.DescRef]: () => DescRef,
  [RenderComponentType.VersionedHeaderLink]: () => VersionedHeaderLink,
  [RenderComponentType.VersionedBlock]: () => VersionedBlock,
  [RenderComponentType.VersionedLink]: () => VersionedLink,
  [RenderComponentType.VersionedNote]: () => VersionedNote,
  [RenderComponentType.VersionedContentReplace]:
    (renderNodes) =>
    ({ defaultContent, versionedContent }) =>
      (
        <VersionedContentReplace
          defaultContent={<>{renderNodes(defaultContent)}</>}
          versionedContent={versionedContent.map(
            ({ version, content }: any) => ({
              version,
              content: renderNodes(content),
            })
          )}
        />
      ),
};

export const docsReactComponents = {
  // DocsNavTable: DocsNavTable,
};
