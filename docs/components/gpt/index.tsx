"use client";

import { useEffect, useRef, useState } from "react";

import cn from "@edgedb-site/shared/utils/classNames";
import { useOverlayActive } from "@edgedb-site/shared/hooks/useOverlayActive";

import GPTPanel from "./panel";

import styles from "./gpt.module.scss";

export function AskAI() {
  const [panelOpen, setPanelOpen] = useOverlayActive("AskAI", {
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
      {panelOpen ? <GPTPanel closePanel={() => setPopupOpen(false)} /> : null}
    </div>
  );
}
