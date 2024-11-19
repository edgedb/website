"use client";

import { PropsWithChildren, useState } from "react";
import cn from "@edgedb-site/shared/utils/classNames";
import { useDocVersion } from "@/hooks/docVersion";
import styles from "./versioned.module.scss";
import { isVersionDev } from "@edgedb-site/shared/utils/index";

export interface VersionedBlockProps {
  versionAdded: string;
}

export function VersionedBlock({
  versionAdded,
  children,
}: PropsWithChildren<VersionedBlockProps>) {
  const currentVersion = useDocVersion().version;
  const isVersionAddedDev = isVersionDev(versionAdded);
  const [show, setShow] = useState(false);

  return (
    <>
      {currentVersion >= versionAdded || show ? (
        children
      ) : !isVersionAddedDev ? (
        <div className={cn(styles.hiddenSection)}>
          <div className={styles.content}>{children}</div>
          <div className={styles.showMore} onClick={() => setShow(true)}>
            <span>Show more...</span>
          </div>
        </div>
      ) : null}
    </>
  );
}

export interface VersionedLinkProps {
  versionAdded: string;
}

export function VersionedLink({
  versionAdded,
  children,
}: PropsWithChildren<VersionedLinkProps>) {
  const currentVersion = useDocVersion().version;

  return (
    <>
      {children}
      {versionAdded > currentVersion ? ` (added in ${versionAdded})` : null}
    </>
  );
}
