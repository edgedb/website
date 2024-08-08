"use client";

import { useState, useLayoutEffect } from "react";

import { useOverlayActive } from "@edgedb-site/shared/hooks/useOverlayActive";

import { SearchIcon } from "./icons";

import styles from "./search.module.scss";

export function HeaderSearchButton() {
  const [_, setPanelOpen] = useOverlayActive("Search", { ignoreEsc: true });
  const [isMac, setIsMac] = useState(false);

  // Would probably be better to use `suppressHydrationWarning`
  // but that's broken in app router: https://github.com/vercel/next.js/issues/58493
  useLayoutEffect(() =>
    setIsMac(navigator.platform.toLowerCase().includes("mac"))
  );

  return (
    <div
      className={styles.headerSearchButton}
      onClick={() => setPanelOpen(true)}
    >
      <SearchIcon />
      <div className={styles.placeholder}>Search</div>
      <div className={styles.shortcut}>
        <span>{isMac ? "⌘" : "ctrl"}</span>
        <span>/</span>
      </div>
    </div>
  );
}

export function MobileSearchButton() {
  const [_, setPanelOpen] = useOverlayActive("Search", { ignoreEsc: true });

  return (
    <div
      className={styles.mobileSearchButton}
      onClick={() => setPanelOpen(true)}
    >
      <SearchIcon />
    </div>
  );
}
