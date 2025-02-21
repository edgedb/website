"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import cn from "@edgedb-site/shared/utils/classNames";

import { useOverlayActive } from "@edgedb-site/shared/hooks/useOverlayActive";
import { SideNav } from "@/components/layout/sideNav";

import { DocsMenuIcon } from "@/components/icons";
import TagList from "@/components/easyedb/tagList";

import {
  getLangAndChapterNo,
  getChapterUrl,
} from "@/dataSources/easyedb/utils";

import styles from "./easyedbToC.module.scss";

type navData = {
  chapterNo: number;
  chapterName: string;
  title: string;
  tags: string[];
}[];

export default function EasyEDBToC() {
  const params = useParams<{ chapterNo?: string[] }>();
  const { chapterNo: currentChapter, lang } = getLangAndChapterNo(
    params.chapterNo
  );

  const navData = require(`@/build-cache/easyedb/${lang}/nav.json`) as navData;

  const [menuOpen, setMenuOpen] = useOverlayActive("SideNav");

  return (
    <>
      <div className={styles.toc}>
        <div className={styles.tocCenterWrapper}>
          <div
            className={styles.menuButton}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className={styles.iconButton}>{<DocsMenuIcon />}</div>
          </div>

          <div className={styles.tocWrapper}>
            {navData.map((item) => {
              const current = item.chapterNo === currentChapter;

              const url = getChapterUrl(item.chapterNo, lang);

              return (
                <Link
                  href={url}
                  key={item.chapterNo}
                  className={cn(styles.chapterLink, {
                    [styles.current]: current,
                  })}
                >
                  <div className={styles.tooltip}>
                    <div className={styles.chapterName}>{item.chapterName}</div>
                    {item.title}
                    <TagList className={styles.tags} tags={item.tags} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <SideNav
        className={styles.overlayMenu}
        contentClassName={styles.overlayContent}
        alwaysOverlay
        hideMenuButton={["lg", "xl", "xxl", "max"]}
      >
        <ChapterList
          lang={lang}
          navData={navData}
          currentChapter={currentChapter}
        />
      </SideNav>
    </>
  );
}

interface ChapterListProps {
  lang: string;
  navData: navData;
  currentChapter: number;
}

function ChapterList({ lang, navData, currentChapter }: ChapterListProps) {
  return (
    <div
      className={styles.chapterList}
      style={
        {
          "--currentChapter": currentChapter,
        } as any
      }
    >
      {navData.map((item) => {
        const current = item.chapterNo === currentChapter;

        const url = getChapterUrl(item.chapterNo, lang);

        return (
          <Link
            href={url}
            key={item.chapterNo}
            className={cn(styles.chapterItem, {
              [styles.current]: current,
            })}
          >
            <svg
              className={styles.line}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              preserveAspectRatio="none"
            >
              <path d="M 8 0 v 0 16" />
            </svg>
            <svg
              className={styles.ring}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
            >
              <circle cx="8" cy="8" r="6.5"></circle>
            </svg>
            <svg
              className={styles.dot}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
            >
              <circle cx="8" cy="8" r="3.4"></circle>
            </svg>
            {item.chapterName}

            <div className={styles.chapterTitle}>{item.title}</div>

            {item.tags?.length ? (
              <TagList className={styles.tags} tags={item.tags} />
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
