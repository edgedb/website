"use client";

import { useState, useContext, createContext, PropsWithChildren } from "react";
import cn from "@edgedb-site/shared/utils/classNames";
import { useBrowserLayoutEffect } from "@edgedb-site/shared/hooks/useBrowserLayoutEffect";
import styles from "./code.module.scss";

const CodeTabContext = createContext<{
  groups: { [groupId: string]: string };
  setGroupTab: (groupId: string, tabLang: string) => void;
}>(null!);

export function CodeTabContextProvider({ children }: PropsWithChildren<{}>) {
  const [groups, setGroups] = useState<{ [groupId: string]: string }>({});

  useBrowserLayoutEffect(() => {
    const storedGroups = localStorage.getItem("codeTabsGroups");
    if (storedGroups) {
      try {
        setGroups(JSON.parse(storedGroups));
      } catch {}
    }
  }, []);

  return (
    <CodeTabContext.Provider
      value={{
        groups,
        setGroupTab: (groupId: string, tabLang: string) => {
          const newGroups = { ...groups, [groupId]: tabLang };
          setGroups(newGroups);
          localStorage.setItem("codeTabsGroups", JSON.stringify(newGroups));
        },
      }}
    >
      {children}
    </CodeTabContext.Provider>
  );
}

export interface CodeTab {
  name: string;
  lang: string;
  kind: "code" | "text";
  codeBlock: JSX.Element;
}
export interface CodeTabsProps {
  className?: string;
  group?: string;
  tabs: CodeTab[];
}

export function CodeTabs({ className, group, tabs }: CodeTabsProps) {
  const { groups, setGroupTab } = useContext(CodeTabContext);
  const [_tabIndex, setTabIndex] = useState(0);
  const [randomGroup] = useState(`grp_${Math.random()}`);

  // make each set of tabs independent inside blog posts
  if (typeof window !== "undefined") {
    if (window.location.href.includes("/blog")) {
      group = randomGroup;
    }
  }

  const tabIndex = group
    ? groups[group]
      ? Math.max(
          tabs.findIndex((t) => t.name === groups[group!]),
          0
        )
      : 0
    : _tabIndex;

  return (
    <div className={cn(styles.codeTabs, className)}>
      <div className={styles.tabs}>
        {tabs.map((tab, i) => (
          <div
            key={i}
            className={cn(styles.tab, { [styles.selected]: tabIndex === i })}
            onClick={() => {
              if (group) {
                setGroupTab(group, tab.name);
              } else {
                setTabIndex(i);
              }
            }}
          >
            {tab.name}
          </div>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={i}
          className={cn(
            styles.tabContent,
            tab.kind === "code" ? "" : styles.textTabContent,
            {
              [styles.selected]: tabIndex === i,
            }
          )}
        >
          {tab.codeBlock}
        </div>
      ))}
    </div>
  );
}
