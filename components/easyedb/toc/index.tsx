import {useEffect, useRef, useState} from "react";
import Link from "next/link";

import cn from "@/utils/classNames";
import {useOverlayActive} from "hooks/useOverlayActive";

import {DocsMenuIcon, CloseIcon} from "@/components/icons";
import TagList from "@/components/easyedb/tagList";
import ThemeSwitcher from "@/components/docs/themeSwitcher";

import {getChapterUrl} from "dataSources/easyedb/utils";

import styles from "./easyedbToC.module.scss";

type navData = {
  chapterNo: number;
  chapterName: string;
  title: string;
  tags: string[];
}[];

interface EasyEDBToCProps {
  lang: string;
  currentChapter: number;
}

export default function EasyEDBToC({currentChapter, lang}: EasyEDBToCProps) {
  const navData = require(`@/build-cache/easyedb/${lang}/nav.json`) as navData;

  const [menuOpen, setMenuOpen] = useOverlayActive("EasyEDBToC");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hideToc, setHideToc] = useState(true);
  const tocRef = useRef<HTMLDivElement>(null);
  const scrollIntersectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollIntersectorRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          setScrollProgress(1 - entry.intersectionRatio);
        },
        {
          threshold: Array(101)
            .fill(0)
            .map((_, i) => i / 100),
        }
      );

      observer.observe(scrollIntersectorRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [scrollIntersectorRef]);

  useEffect(() => {
    if (tocRef.current) {
      // @ts-ignore
      const observer = new ResizeObserver((entries) => {
        setHideToc(
          entries[0].target.clientHeight < entries[0].target.scrollHeight
        );
      });

      observer.observe(tocRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [tocRef]);

  return (
    <div
      ref={tocRef}
      className={cn(styles.toc, {
        [styles.hideToc]: hideToc,
        [styles.menuOpen]: menuOpen,
      })}
      style={{"--scrollProgress": scrollProgress} as any}
    >
      <div ref={scrollIntersectorRef} className={styles.scrollIntersector} />
      <div className={styles.paddingBlockTop} />
      <div className={styles.tocCenterWrapper}>
        <div
          className={styles.menuButton}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className={styles.iconButton}>
            {menuOpen ? <CloseIcon /> : <DocsMenuIcon />}
          </div>
        </div>

        <div className={styles.tocWrapper}>
          {navData.map((item) => {
            const current = item.chapterNo === currentChapter;

            const url = getChapterUrl(item.chapterNo, lang);

            return (
              <Link href={url} key={item.chapterNo}>
                <a
                  className={cn(styles.chapterLink, {
                    [styles.current]: current,
                  })}
                >
                  <div className={styles.tooltip}>
                    <div className={styles.chapterName}>
                      {item.chapterName}
                    </div>
                    {item.title}
                    <TagList className={styles.tags} tags={item.tags} />
                  </div>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
      <div className={styles.paddingBlockBottom} />

      <div
        className={styles.floatingMenuButton}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <div className={styles.iconButton}>
          {menuOpen ? <CloseIcon /> : <DocsMenuIcon />}
        </div>
      </div>

      {menuOpen ? (
        <div className={styles.overlay} onClick={() => setMenuOpen(false)} />
      ) : null}

      <div className={styles.overlayMenu}>
        <ThemeSwitcher className={styles.themeSwitcher} />
        <div className={styles.closeMenu} onClick={() => setMenuOpen(false)}>
          <CloseIcon />
        </div>
        <div className={styles.overlayHeader}></div>
        <div className={styles.chaptersOuterWrapper}>
          <div className={styles.chaptersWrapper}>
            <ChapterList
              lang={lang}
              navData={navData}
              currentChapter={currentChapter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChapterListProps {
  lang: string;
  navData: navData;
  currentChapter: number;
}

function ChapterList({lang, navData, currentChapter}: ChapterListProps) {
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
          <Link href={url} key={item.chapterNo}>
            <a
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
            </a>
          </Link>
        );
      })}
    </div>
  );
}
