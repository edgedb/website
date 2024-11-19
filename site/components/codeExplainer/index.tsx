import {useState, useRef, useEffect} from "react";

import cn from "@edgedb-site/shared/utils/classNames";

import {Code} from "@edgedb-site/shared/components/code";
import {ChevronLeftIcon} from "@/components/icons";

import styles from "./codeExplainer.module.scss";

interface CodeBlock {
  name: string;
  code: string;
  language?: string;
  explanation: string;
  explanationLanguage?: string;
}

interface CodeExplainerProps {
  blocks: [CodeBlock, ...CodeBlock[]];
  defaultCodeLanguage?: string;
  defaultExplanationLanguage?: string;
  className?: string;
}

export default function CodeExplainer({
  blocks,
  defaultCodeLanguage,
  defaultExplanationLanguage,
  className,
}: CodeExplainerProps) {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabsRef = useRef<HTMLDivElement>(null);

  const block = blocks[selectedTab];

  const codeLanguage = block.language || defaultCodeLanguage;
  const explanationLanguage =
    block.explanationLanguage || defaultExplanationLanguage;

  const setSelectedTabRel = (offset: number) => {
    const selectedIndex = selectedTab + offset;

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
    <div className={cn(styles.codeExplainer, className)}>
      <div className={styles.header}>
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
            {blocks.map((block, i) => (
              <div
                key={`${i}`}
                className={cn(styles.tab, {
                  [styles.selectedTab]: selectedTab === i,
                })}
                onClick={() => setSelectedTab(i)}
              >
                <span>{block.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div
          className={cn(styles.rightArrow, {
            [styles.inactive]: selectedTab === blocks.length - 1,
          })}
          onClick={() => setSelectedTabRel(1)}
        >
          <ChevronLeftIcon />
        </div>
      </div>
      <div className={styles.codeBlock}>
        <div className={styles.codeBlockInner}>
          {codeLanguage ? (
            <Code
              className={styles.code}
              code={block.code}
              language={codeLanguage}
            />
          ) : (
            <pre className={styles.explanation}>{block.code}</pre>
          )}
          {explanationLanguage ? (
            <Code
              className={styles.code}
              code={block.explanation}
              language={explanationLanguage}
            />
          ) : (
            <pre className={styles.explanation}>{block.explanation}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
