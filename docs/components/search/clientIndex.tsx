"use client";

import { useEffect, useRef, useState } from "react";

import cn from "@edgedb-site/shared/utils/classNames";
import { useOverlayActive } from "@edgedb-site/shared/hooks/useOverlayActive";

import type { DocsBreadcrumbs } from "@/dataSources/docs/nav";
import {
  getDocsIndexDef,
  getEasyEDBIndexDef,
  getTutorialIndexDef,
  getQnAIndexDef,
} from "./indexDefs";

import SearchPanel from "./panel";

import styles from "./search.module.scss";

const isMac =
  typeof navigator !== "undefined"
    ? navigator.platform.toLowerCase().includes("mac")
    : false;

export function Search({
  docsBreadcrumbs,
}: {
  docsBreadcrumbs: DocsBreadcrumbs;
}) {
  const [indexes] = useState(() => ({
    ...getDocsIndexDef(docsBreadcrumbs),
    ...getTutorialIndexDef(),
    ...getEasyEDBIndexDef("en"),
    // ...getQnAIndexDef(),
  }));

  const [panelOpen, setPanelOpen, _, data, reEnableScrolling] =
    useOverlayActive("Search", {
      ignoreEsc: true,
    });

  const overlayRef = useRef<HTMLDivElement>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    setPopupOpen(panelOpen);
  }, [panelOpen]);

  useEffect(() => {
    if (!popupOpen) {
      overlayRef.current!.addEventListener(
        "transitionend",
        () => setPanelOpen(false),
        { once: true }
      );
    }
  }, [popupOpen]);

  useEffect(() => {
    const globalKeyListener = (e: KeyboardEvent) => {
      if (e.key === "/" && (isMac ? e.metaKey : e.ctrlKey) && !panelOpen) {
        e.preventDefault();
        setPanelOpen(true);
      }
      if (e.key === "Escape" && popupOpen) {
        e.preventDefault();
        setPopupOpen(false);
      }
    };

    window.addEventListener("keydown", globalKeyListener);

    return () => {
      window.removeEventListener("keydown", globalKeyListener);
    };
  }, [panelOpen, popupOpen]);

  return (
    <div
      ref={overlayRef}
      className={cn(styles.modalOverlay, { [styles.popupOpen]: popupOpen })}
      onClick={() => setPopupOpen(false)}
    >
      {panelOpen ? (
        <SearchPanel
          indexes={indexes}
          initialTabId={data?.tabId}
          closePanel={() => {
            reEnableScrolling();
            setPopupOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
