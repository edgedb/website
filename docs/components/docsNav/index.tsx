"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import Link from "next/link";

import cn from "@edgedb-site/shared/utils/classNames";

import styles from "./docsNav.module.scss";

import { ExternalLinkIcon } from "./icons";
import type { DocsNavTreeItem, UrlMapping } from "@/dataSources/docs/nav";
import { SideNav } from "../layout/sideNav";
import { VersionSwitcher } from "../versionSwitcher";
import { useDocVersion } from "@/hooks/docVersion";
import { getVersionTag } from "@edgedb-site/shared/utils";

function renderTreeItem(ctx: {
  item: DocsNavTreeItem;
  depth: number;
  pathname: string;
  activePaths: Set<string>;
  expandedPaths: Set<string>;
  setExpandedPaths: (paths: Set<string>) => void;
  currentVersion: string;
}) {
  const { item, depth } = ctx;

  const isActive = ctx.activePaths.has(item.uri);
  const isExpanded = ctx.expandedPaths.has(item.uri);

  const badge =
    item.versionAdded && item.versionAdded === ctx.currentVersion
      ? "New"
      : null;

  const versionTag = getVersionTag(ctx.currentVersion);

  return (
    <li
      key={item.uri}
      className={cn({
        [styles.hidden]:
          !!item.versionAdded && item.versionAdded > ctx.currentVersion,
      })}
    >
      {item.children?.length ? (
        <>
          <div
            className={cn(styles.navItem, styles.expandable, {
              [styles.nested]: depth > 1,
              [styles.active]: isActive,
              [styles.expanded]: isExpanded || isActive,
            })}
            onClick={() => {
              const items = new Set(ctx.expandedPaths);
              if (items.has(item.uri)) {
                items.delete(item.uri);
              } else {
                items.add(item.uri);
              }
              ctx.setExpandedPaths(items);
            }}
          >
            <Arrow />
            {item.title}
          </div>
          {
            <ul className={cn({ [styles.expanded]: isExpanded || isActive })}>
              {item.noIndexPage ? null : (
                <li>
                  <Link
                    className={cn(styles.navItem, {
                      [styles.nested]: depth > 0,
                      [styles.active]: item.uri === ctx.pathname,
                    })}
                    href={item.uri}
                  >
                    Overview
                  </Link>
                </li>
              )}
              {item.children.map((childItem) =>
                renderTreeItem({ ...ctx, item: childItem, depth: depth + 1 })
              )}
            </ul>
          }
        </>
      ) : (
        <Link
          className={cn(styles.navItem, {
            [styles.nested]: depth > 1,
            [styles.active]: isActive,
          })}
          href={item.uri}
        >
          {item.title}

          {item.external ? (
            <ExternalLinkIcon className={styles.externalLink} />
          ) : null}

          {badge ? (
            <span
              className={cn(styles.badge, {
                [styles.versionLatest]: versionTag === "latest",
                [styles.versionDev]: versionTag === "dev",
              })}
            >
              {badge}
            </span>
          ) : null}
        </Link>
      )}
    </li>
  );
}

function Arrow() {
  return (
    <svg
      className={styles.arrow}
      width="6"
      height="6"
      viewBox="0 0 6 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0.846819 0.0764906L5.06398 2.51121C5.44026 2.7285 5.44026 3.2715 5.06398 3.48879L0.846819 5.92351C0.470532 6.1408 0.000173563 5.8693 0.000173544 5.43472L0.000173331 0.565278C0.000173312 0.130705 0.470532 -0.140796 0.846819 0.0764906Z" />
    </svg>
  );
}

function getActivePaths(urlMapping: UrlMapping, pathname: string): Set<string> {
  let currentItem = urlMapping.get(pathname);
  const activePaths = new Set<string>();
  while (currentItem) {
    activePaths.add(currentItem.uri);
    currentItem = currentItem.parent;
  }
  return activePaths;
}

export default function DocsNav({
  navData: { navTree, urlMapping },
  header,
  showVersionSwitcher,
}: {
  navData: {
    navTree: DocsNavTreeItem[];
    urlMapping: UrlMapping;
  };
  header: string;
  showVersionSwitcher?: boolean;
}) {
  const pathname = usePathname();

  const currentVersion = useDocVersion().version;

  const activePaths = getActivePaths(urlMapping, pathname);

  const [expandedPaths, setExpandedPaths] = useState(() => new Set<string>());

  return (
    <SideNav
      className={styles.docsNav}
      header={
        showVersionSwitcher ? (
          <>
            {header}
            <VersionSwitcher />
          </>
        ) : (
          header
        )
      }
      contentClassName={
        showVersionSwitcher ? styles.navContentWithVersionSwitcher : undefined
      }
    >
      <ul>
        {navTree.map((item) =>
          renderTreeItem({
            item,
            depth: 1,
            pathname,
            activePaths,
            expandedPaths,
            setExpandedPaths,
            currentVersion,
          })
        )}
      </ul>
    </SideNav>
  );
}
