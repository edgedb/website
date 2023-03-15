import {useEffect, useMemo, useRef, useState, Fragment} from "react";

import cn from "@/utils/classNames";

import {Prism} from "@/components/code";
import {ChevronLeftIcon} from "@/components/icons";

import styles from "./annotatedCodeBlock.module.scss";

type AnnotatedCode = (
  | string
  | {
      id: string;
      code: string;
      title: string;
      description: string | JSX.Element;
    }
)[];

interface AnnotatedCodeBlockProps {
  language: string;
  code: AnnotatedCode;
}

function annotateCode(rawCode: AnnotatedCode, language: string) {
  const annotations: {
    id: string;
    title: string;
    description: string | JSX.Element;
  }[] = [];
  let joinedCode = "";
  const offsets: {id: string; start: number; end: number}[] = [];

  const ids = new Set<string>();
  for (const frag of rawCode) {
    if (typeof frag === "string") {
      joinedCode += frag;
    } else {
      if (ids.has(frag.id)) {
        throw new Error(`duplicate annotation id: ${frag.id}`);
      }
      annotations.push({
        id: frag.id,
        title: frag.title,
        description: frag.description,
      });
      ids.add(frag.id);
      offsets.push({
        id: frag.id,
        start: joinedCode.length,
        end: joinedCode.length + frag.code.length,
      });
      joinedCode += frag.code;
    }
  }

  const tokens = Prism.tokenize(joinedCode, Prism.languages[language]);

  const blocks: {
    id?: string;
    content: JSX.Element[];
  }[] = [];

  let currentBlock: {id?: string; content: (string | JSX.Element)[]} = {
    content: [],
  };
  let cursor = 0;
  let offsetIndex = 0;
  let nextSplitOffset = offsets[0]?.start ?? -1;
  for (const tok of tokens) {
    const {content, type} =
      typeof tok === "string"
        ? {content: tok, type: null}
        : (tok as {content: string; type: string});
    if (cursor + content.length > nextSplitOffset) {
      const splitOffset = nextSplitOffset - (cursor + content.length);
      currentBlock.content.push(
        type ? (
          <span className={`token ${type}`}>
            {content.slice(0, splitOffset)}
          </span>
        ) : (
          content.slice(0, splitOffset)
        )
      );
      blocks.push({
        ...currentBlock,
        content: currentBlock.content.map((frag, i) => (
          <Fragment key={`${blocks.length}-${i}`}>{frag}</Fragment>
        )),
      });
      if (currentBlock.id == null) {
        nextSplitOffset = offsets[offsetIndex].end;
        currentBlock = {id: offsets[offsetIndex].id, content: []};
      } else {
        offsetIndex += 1;
        nextSplitOffset = offsets[offsetIndex]?.start ?? joinedCode.length + 1;
        currentBlock = {content: []};
      }
      currentBlock.content.push(
        type ? (
          <span className={`token ${type}`}>{content.slice(splitOffset)}</span>
        ) : (
          content.slice(splitOffset)
        )
      );
    } else {
      currentBlock.content.push(
        type ? <span className={`token ${type}`}>{content}</span> : content
      );
    }
    cursor += content.length;
  }
  blocks.push({
    ...currentBlock,
    content: currentBlock.content.map((frag, i) => (
      <Fragment key={`${blocks.length}-${i}`}>{frag}</Fragment>
    )),
  });

  return {
    blocks,
    annotations,
    lineNumbers: joinedCode
      .split("\n")
      .map((_, i) => i + 1)
      .join("\n"),
  };
}

export default function AnnotatedCodeBlock({
  code,
  language,
}: AnnotatedCodeBlockProps) {
  const {blocks, annotations, lineNumbers} = useMemo(
    () => annotateCode(code, language),
    [code, language]
  );

  const [selectedTab, setSelectedTab] = useState(0);
  const [hideTabArrows, setHideTabArrows] = useState(true);

  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tabsRef.current) {
      const observer = new ResizeObserver(() => {
        if (tabsRef.current) {
          const hideArrows =
            tabsRef.current.clientWidth >= tabsRef.current.scrollWidth;
          if (hideTabArrows !== hideArrows) {
            setHideTabArrows(hideArrows);
          }
        }
      });

      observer.observe(tabsRef.current);

      return () => observer.disconnect();
    }
  }, [hideTabArrows]);

  const setSelectedTabRel = (offset: number) => {
    const selectedIndex = selectedTab + offset;

    if (selectedIndex < 0 || selectedIndex >= annotations.length) {
      return;
    }

    setSelectedTab(selectedIndex);
  };

  useEffect(() => {
    if (tabsRef.current) {
      const tabEl = tabsRef.current.children[0].children[
        selectedTab
      ] as HTMLDivElement;

      const scrollElRect = tabsRef.current.getBoundingClientRect();
      const tabElRect = tabEl.getBoundingClientRect();

      const tabLeft =
        tabElRect.left - scrollElRect.left + tabsRef.current.scrollLeft;
      const desiredScrollLeft =
        tabLeft - (scrollElRect.width - tabElRect.width) / 2;

      tabsRef.current.scrollTo({left: desiredScrollLeft, behavior: "smooth"});
    }
  }, [selectedTab]);

  return (
    <div className={styles.annotatedCodeBlock}>
      <div
        className={cn(styles.header, {
          [styles.hideArrows]: hideTabArrows,
        })}
      >
        <div
          className={cn(styles.leftArrow, {
            [styles.inactive]: selectedTab === 0,
          })}
          onClick={() => setSelectedTabRel(-1)}
        >
          <ChevronLeftIcon />
        </div>
        <div className={styles.tabsWrapper} ref={tabsRef}>
          <div className={styles.tabs}>
            {annotations.map((anno, i) => (
              <div
                key={`${i}`}
                className={cn(styles.tab, {
                  [styles.selectedTab]: selectedTab === i,
                })}
                onClick={() => setSelectedTab(i)}
              >
                <span>{anno.title}</span>
              </div>
            ))}
          </div>
        </div>
        <div
          className={cn(styles.rightArrow, {
            [styles.inactive]: selectedTab === annotations.length - 1,
          })}
          onClick={() => setSelectedTabRel(1)}
        >
          <ChevronLeftIcon />
        </div>
      </div>
      <div className={styles.card}>
        <pre className={styles.codeBlock}>
          <div className={styles.lineNumbers}>{lineNumbers}</div>
          <div>
            {blocks.map((block, i) =>
              block.id != null ? (
                <span
                  key={i}
                  className={cn({
                    [styles.selected]:
                      block.id === annotations[selectedTab].id,
                  })}
                >
                  {block.content}
                </span>
              ) : (
                <Fragment key={i}>{block.content}</Fragment>
              )
            )}
          </div>
        </pre>
        <div className={styles.description}>
          {annotations.map((ann, j) => (
            <div
              style={{display: selectedTab === j ? "block" : "none"}}
              key={`${j}`}
            >
              {ann.description}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
