"use client";

import { useOverlayActive } from "@edgedb-site/shared/hooks/useOverlayActive";

import { OpenAILogo } from "./icons";

import styles from "./gpt.module.scss";

export function HeaderAskAIButton() {
  const [_, setPanelOpen] = useOverlayActive("AskAI", { ignoreEsc: true });

  return (
    <div
      className={styles.headerAskAIButton}
      onClick={() => setPanelOpen(true)}
    >
      <OpenAILogo />
      <div className={styles.label}>Ask AI</div>
    </div>
  );
}

export function MobileAskAIButton() {
  const [_, setPanelOpen] = useOverlayActive("AskAI", { ignoreEsc: true });

  return (
    <div
      className={styles.mobileAskAIButton}
      onClick={() => setPanelOpen(true)}
    >
      <OpenAILogo />
    </div>
  );
}
