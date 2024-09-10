"use client";

import { useOverlayActive } from "@edgedb-site/shared/hooks/useOverlayActive";

import styles from "../qna.module.scss";

import { SearchIcon } from "@/components/search/icons";

export function QnASearchButton() {
  const [_, setOverlayActive] = useOverlayActive("Search", {
    ignoreEsc: true,
    data: { tabId: "qna" },
  });

  return (
    <div className={styles.searchButton} onClick={() => setOverlayActive(true)}>
      <SearchIcon />
      Search Q&As
    </div>
  );
}
