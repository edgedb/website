"use client";

import { useDocVersion } from "@/hooks/docVersion";
import type { PackedRenderNode } from "@edgedb-site/build-tools/xmlRenderer/interfaces";

export interface VersionedContentReplaceRenderProps {
  defaultContent: (string | PackedRenderNode)[];
  versionedContent: {
    version: string;
    content: (string | PackedRenderNode)[];
  }[];
}

export interface VersionedContentReplaceProps {
  defaultContent: JSX.Element;
  versionedContent: { version: string; content: JSX.Element }[];
}

export function VersionedContentReplace({
  defaultContent,
  versionedContent,
}: VersionedContentReplaceProps) {
  const currentVersion = useDocVersion().version;

  for (let i = versionedContent.length - 1; i >= 0; i--) {
    if (currentVersion >= versionedContent[i].version) {
      return versionedContent[i].content;
    }
  }

  return defaultContent;
}
