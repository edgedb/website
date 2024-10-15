"use client";

import cn from "@edgedb/common/utils/classNames";

import { useDocVersion } from "@/hooks/docVersion";
import { getVersionTag } from "@edgedb-site/shared/utils/index";

import styles from "./versionedNote.module.scss";

export interface VersionedNoteProps {
  versionAdded?: string;
  versionChanged?: string;
}

export default function VersionedNote({
  children,
  versionAdded,
  versionChanged, // todo update for version changed
}: React.PropsWithChildren<VersionedNoteProps>) {
  const currentVersion = useDocVersion().version;
  const versionAddedTag = versionAdded && getVersionTag(versionAdded);
  const isVersionAddedDev = versionAddedTag === "dev";

  const showBadge =
    currentVersion === versionAdded ||
    (currentVersion < versionAdded! && !isVersionAddedDev);

  return (
    <div
      className={cn(styles.versionedNote, {
        [styles.showBadge]: showBadge,
        [styles.versionLatest]: versionAddedTag === "latest",
        [styles.versionDev]:
          isVersionAddedDev && currentVersion === versionAdded,
      })}
    >
      {showBadge ? (
        <span
          className={cn(styles.badge, {
            [styles.versionLatest]: versionAddedTag === "latest",
            [styles.versionDev]:
              isVersionAddedDev && currentVersion === versionAdded,
          })}
        >
          {currentVersion == versionAdded ? "New" : `Added in v${versionAdded}`}
        </span>
      ) : null}
      <div className={styles.noteContent}>{children}</div>
    </div>
  );
}
