"use client";

import { useEffect, useState } from "react";

import { Header } from "@edgedb-site/build-tools/xmlRenderer";

import cn from "@edgedb-site/shared/utils/classNames";
import { useVisibleElement } from "@edgedb-site/shared/hooks/useVisibleElement";

import { useDocVersion } from "@/hooks/docVersion";
import { isVersionDev } from "@edgedb-site/shared/utils";

import styles from "./docsToc.module.scss";

export function DocsToC({
  headers: _headers,
  sectionSelector,
  anchorVersions,
  pageVer,
}: {
  headers: Header[];
  sectionSelector: string;
  anchorVersions?: { [key: string]: string };
  pageVer?: string;
}) {
  const headers = _headers.filter((header) => header.level === 2);

  const { version: currentVersion, setVersion } = useDocVersion();
  const isCurrentVersionDev = isVersionDev(currentVersion);

  const [activeId, setActiveId] = useState<string | null>(null);

  useVisibleElement(
    () => {
      const headerIds = new Set(headers.map((header) => header.id));

      const els = [
        ...document.querySelectorAll<HTMLElement>(sectionSelector),
      ].filter((el) => {
        return headerIds.has(el.dataset.sectionId ?? "");
      });
      return els;
    },
    (el) => {
      if (el) {
        setActiveId(el.dataset.sectionId!);
      }
    },
    [headers]
  );

  useEffect(() => {
    const hash = location.hash.slice(1);

    if (
      hash &&
      anchorVersions?.[hash] &&
      anchorVersions[hash] > currentVersion
    ) {
      setVersion(anchorVersions![hash]);
      setTimeout(() => location.replace(location.href), 0);
    } else if (pageVer && pageVer > currentVersion) {
      setVersion(pageVer);
    }
  }, [anchorVersions, pageVer]);

  return (
    <div className={styles.docsToc}>
      {headers.map((header) => (
        <a
          href={`#${header.id}`}
          key={header.id}
          className={cn({
            [styles.active]: activeId === header.id,
            [styles.faded]:
              !!header.versionAdded && header.versionAdded > currentVersion,
          })}
        >
          {header.title}

          {header.versionAdded === currentVersion ? (
            <span
              className={cn(styles.badge, {
                [styles.versionDev]: !!isCurrentVersionDev,
              })}
            >
              {"New"}
            </span>
          ) : null}
        </a>
      ))}
    </div>
  );
}
