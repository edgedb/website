"use client";
import { PropsWithChildren } from "react";

import cn from "@edgedb-site/shared/utils/classNames";

import HeaderLink, {
  HeaderLinkProps,
} from "@edgedb-site/shared/components/headerLink";

import { useDocVersion } from "@/hooks/docVersion";
import { getVersionTag } from "@edgedb-site/shared/utils/index";

import styles from "./versioned.module.scss";

export interface VersionedHeaderLinkProps
  extends Omit<HeaderLinkProps, "badge" | "badgeClass"> {
  versionAdded?: string;
}

export default function VersionedHeaderLink({
  versionAdded,
  ...props
}: PropsWithChildren<VersionedHeaderLinkProps>): JSX.Element {
  const version = useDocVersion().version;
  const versionAddedTag = versionAdded && getVersionTag(versionAdded);
  const isVersionAddedDev = versionAddedTag === "dev";
  const showBadge =
    version && (version === versionAdded || version < versionAdded!);

  return (
    <HeaderLink
      {...props}
      badge={
        showBadge
          ? version == versionAdded
            ? "New"
            : `Added in v${versionAdded}`
          : undefined
      }
      badgeClass={
        showBadge
          ? cn({
              [styles.versionAddedLatest]: versionAddedTag === "latest",
              [styles.versionAddedDev]: isVersionAddedDev,
            })
          : undefined
      }
    />
  );
}
