import {PropsWithChildren, useState} from "react";

import cn from "@/utils/classNames";

import {useDocVersion} from "../docVersionContext";

import styles from "./versioned.module.scss";

export interface VersionedBlockProps {
  versionAdded: string;
  overhang?: boolean;
}

export function VersionedBlock({
  versionAdded,
  overhang = false,
  children,
}: PropsWithChildren<VersionedBlockProps>) {
  const currentVersion = useDocVersion().version;

  const [show, setShow] = useState(false);

  return (
    <>
      {currentVersion >= versionAdded || show ? (
        children
      ) : (
        <div
          className={cn(styles.hiddenSection, {[styles.overhang]: overhang})}
        >
          <div className={styles.content}>{children}</div>
          <div className={styles.showMore} onClick={() => setShow(true)}>
            <span>Show more...</span>
          </div>
        </div>
      )}
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
