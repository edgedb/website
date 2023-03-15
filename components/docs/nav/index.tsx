import {useEffect, useRef, useState} from "react";

import Link from "next/link";
import {useRouter} from "next/router";

import cn from "@/utils/classNames";

import {useOverlayActive} from "hooks/useOverlayActive";
import {mediaQuery} from "hooks/mediaQuery";

import styles from "./docsNav.module.scss";

import * as icons from "./icons";
import {DocsMenuIcon, CloseIcon} from "@/components/icons";
import ThemeSwitcher from "@/components/docs/themeSwitcher";
import VersionSwitcher from "@/components/docs/versionSwitcher";
import ScrollBar from "@/components/customScrollbar";

import pathAliases from "dataSources/docs/pathAliases";
import {getNavData, DocsNavTreeItem, UrlMapping} from "./navTree";
import {useDocVersion} from "../docVersionContext";

const iconMapping: {
  [key: string]: () => JSX.Element;
} = {
  __default__: icons.DocsUnknownIcon,

  introduction: icons.DocsIntroIcon,
  guides: icons.DocsTutorialIcon,
  datamodel: icons.DocsDataModelIcon,
  edgeql: icons.DocsEdgeQLIcon,
  graphql: icons.DocsGraphQLIcon,
  clients: icons.DocsClientsIcon,
  administration: icons.DocsAdminIcon,
  cli: icons.DocsCliIcon,
  reference: icons.DocsInternalsIcon,
  changelog: icons.DocsChangelogIcon,
  stdlib: icons.DocsStdLibIcon,
  glossary: icons.DocsGlossaryIcon,

  // Old docs
  quickstart: icons.DocsTutorialIcon,
  cheatsheet: icons.DocsCheatsheetIcon,
  internals: icons.DocsInternalsIcon,
};

const trimUrlStart = (url: string, level: number) => {
  return url.replace(/^\//, "").split("/").slice(level).join("/");
};

function getActiveItems(
  urlMapping: UrlMapping,
  currentUrl: string
): [string, Set<DocsNavTreeItem>] {
  let relUrl = trimUrlStart(currentUrl.split("#")[0], 1);

  if (pathAliases.has(relUrl)) {
    relUrl = pathAliases.get(relUrl)!;
  }

  let activeItem = urlMapping.get(relUrl);
  const activeItems: Set<DocsNavTreeItem> = new Set();
  while (activeItem) {
    activeItems.add(activeItem);
    activeItem = activeItem.parent;
  }

  return [relUrl, activeItems];
}

function renderTree(ctx: {
  relUrl: string;
  item: DocsNavTreeItem;
  level: number;
  activeItems: Set<DocsNavTreeItem>;
  expandedItems: Set<DocsNavTreeItem>;
  setExpandedItems: (itemss: Set<DocsNavTreeItem>) => void;
  menuOpen: boolean;
  currentVersion: string;
}) {
  const {relUrl, item, level} = ctx;

  const url = item.uri === "intro" ? `/docs` : `/docs/${item.uri}`;

  let SectionIcon: (() => JSX.Element) | null = null;
  if (level === 1) {
    SectionIcon =
      iconMapping[item.introPage || "__default__"] ?? icons.DocsIntroIcon;
  }

  const isActive = ctx.activeItems.has(item);
  const isExpanded = isActive || ctx.expandedItems.has(item);

  const hasChildren = level < 3 && item.children?.length;
  const title = item.title;
  const badge =
    item.versionAdded && item.versionAdded === ctx.currentVersion
      ? "New"
      : null;

  return (
    <li key={url}>
      <Link href={url}>
        <a
          className={cn(styles[`level${level}`], {
            [styles.active]: isActive,
            [styles.faded]:
              !!item.versionAdded && item.versionAdded > ctx.currentVersion,
          })}
          onClick={
            hasChildren
              ? (e) => {
                  if (!ctx.menuOpen) {
                    return;
                  }

                  // When rendered inside a navigation menu popup
                  // (e.g. when browsed on a phone) we change the
                  // behavior for category links: instead of navigating
                  // to the page, we instead just expand the tree.
                  e.preventDefault();
                  const items = new Set<DocsNavTreeItem>([item]);
                  let parent = item.parent;
                  while (parent) {
                    items.add(parent);
                    parent = parent.parent;
                  }
                  ctx.setExpandedItems(items);
                }
              : undefined
          }
        >
          {SectionIcon ? (
            <SectionIcon />
          ) : hasChildren ? (
            <ExpandArrow />
          ) : null}
          {title}
          {badge ? <div className={styles.badge}>{badge}</div> : null}
        </a>
      </Link>
      <ul style={isExpanded && hasChildren ? {} : {display: "none"}}>
        <li>
          <Link href={url}>
            <a
              className={cn(styles[`level${level + 1}`], {
                [styles.active]: relUrl === item.uri,
              })}
            >
              Overview
            </a>
          </Link>
        </li>
        {(item.children || []).map((child) =>
          renderTree({...ctx, item: child, level: level + 1})
        )}
      </ul>
    </li>
  );
}

export default function DocsNav() {
  const {navTree, urlMapping} = getNavData();

  const router = useRouter();

  const currentVersion = useDocVersion().version;

  const [menuOpen, setMenuOpen] = useOverlayActive("DocsNav");

  const [expandedItems, setExpandedItems] = useState(
    () => new Set<DocsNavTreeItem>()
  );

  const [relUrl, activeItems] = getActiveItems(urlMapping, router.asPath);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (menuOpen) {
      // Add media query listener to close menu if window is resized from
      // mobile -> desktop width.
      // Fixes an edge case where the window is mobile width, the full-screen
      // menu is opened, then the window is resized to desktop width where the
      // full-screen menu is now visually hidden (by css breakpoint) but the
      // menu is still in the 'open' state, causing the user to be unable to
      // scroll the page.

      return mediaQuery("(max-width: 1024px)", () => setMenuOpen(false));
    }
  }, [menuOpen]);

  return (
    <>
      <div
        ref={scrollRef}
        className={cn(styles.docsNavWrapper, {
          [styles.menuOpen]: menuOpen,
        })}
      >
        <div className={styles.docsNav}>
          <div className={styles.docsControls}>
            <ThemeSwitcher className={styles.themeSwitcher} />
            <VersionSwitcher />
          </div>
          <ul>
            {navTree.map((item) =>
              renderTree({
                relUrl,
                item,
                level: 1,
                activeItems,
                expandedItems,
                setExpandedItems,
                menuOpen,
                currentVersion,
              })
            )}
          </ul>
        </div>
      </div>
      <ScrollBar scrollRef={scrollRef} />
      <div
        className={cn(styles.floatingButton, {
          [styles.menuOpen]: menuOpen,
        })}
        onClick={() => {
          setMenuOpen(!menuOpen);
        }}
      >
        {menuOpen ? <CloseIcon /> : <DocsMenuIcon />}
      </div>
    </>
  );
}

function ExpandArrow() {
  return (
    <svg
      className={styles.expandArrow}
      width="6"
      height="6"
      viewBox="0 0 6 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.92351 0.846331L3.48879 5.06349C3.2715 5.43977 2.7285 5.43977 2.51121 5.06349L0.0764902 0.846331C-0.140796 0.470044 0.130705 -0.000314713 0.565278 -0.000314713H5.43472C5.8693 -0.000314713 6.1408 0.470044 5.92351 0.846331Z"
        fill="currentColor"
      />
    </svg>
  );
}
