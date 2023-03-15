import {useState, useEffect, useRef, useMemo} from "react";
import Link from "next/link";
import {useRouter} from "next/router";

import type {
  IndexSearchResult,
  IndexSearchReturn,
} from "@edgedb/site-build-tools/jolr";
import cn from "@/utils/classNames";

import * as searchWorker from "./worker";
import styles from "./search.module.scss";
import {SearchIcon, CloseIcon} from "@/components/icons";
import * as ResultIcons from "./icons";

import {SearchIndexes} from ".";
import {useSearchContext} from "./context";

import {useDocVersion} from "../docs/docVersionContext";

const RESULT_SCROLL_PADDING = 24;
const PANEL_BASE_HEIGHT = 88;
const PANEL_TABS_HEIGHT = 32;
const OVERLAY_PADDING = 48;

interface SearchPanelProps {
  indexes: SearchIndexes;
  defaultIndexId?: string;
}

export default function SearchPanel({
  indexes,
  defaultIndexId,
}: SearchPanelProps) {
  const [searchValue, setSearchValue] = useState("");

  const [searchResults, updateResults] = useState<IndexSearchReturn | null>(
    null
  );
  const [searchError, setSearchError] = useState("");

  const [selectedIndex, setSelectedIndex] = useState<string | null>(
    defaultIndexId ?? null
  );

  const [overlayHeight, recordOverlayHeight] = useState(0);
  const [resultsHeight, setResultsHeight] = useState(0);

  const searchRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const maxPanelTopMargin = useRef(0.15);

  const router = useRouter();

  const {setPanelOpen} = useSearchContext();

  const currentDocsVersion = useDocVersion()?.version;

  const indexIds = Object.keys(indexes);

  useEffect(() => {
    searchRef.current?.focus();

    searchWorker
      .preloadIndexes(indexIds.map((id) => ({id, path: indexes[id].path})))
      .catch((err) => {
        setSearchError("Failed to load search indexes.");
      });
  }, [indexIds]);

  useEffect(() => {
    if (overlayRef.current) {
      // @ts-ignore
      const observer = new ResizeObserver((entries) => {
        recordOverlayHeight(entries[0].target.clientHeight);
      });

      observer.observe(overlayRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [overlayRef]);

  useEffect(() => {
    if (searchValue) {
      searchWorker
        .search(searchValue, selectedIndex ? [selectedIndex] : indexIds)
        .then((result) => {
          if (result) {
            updateResults(result);
          }
        });
    } else {
      updateResults(null);
    }
  }, [searchValue, selectedIndex]);

  const closePanel = () => {
    setPanelOpen(false);
  };

  let tabs: JSX.Element | null = null;
  if (indexIds.length > 1) {
    tabs = (
      <div className={styles.tabs}>
        <div
          key="all"
          className={cn(styles.tab, {
            [styles.selectedTab]: selectedIndex === null,
          })}
          onClick={() => setSelectedIndex(null)}
        >
          All
        </div>
        {indexIds.map((indexId) => (
          <div
            key={indexId}
            className={cn(styles.tab, {
              [styles.selectedTab]: selectedIndex === indexId,
            })}
            onClick={() => setSelectedIndex(indexId)}
          >
            {indexes[indexId].name}
          </div>
        ))}
      </div>
    );
  }

  const maxPanelSpace = overlayHeight - OVERLAY_PADDING * 2;
  const panelHeight = PANEL_BASE_HEIGHT + (tabs ? PANEL_TABS_HEIGHT : 0);

  const maxPanelHeight = Math.min(
    panelHeight + (searchResults?.results.length ? resultsHeight : 0),
    maxPanelSpace
  );

  if (overlayHeight) {
    maxPanelTopMargin.current = Math.min(
      maxPanelTopMargin.current,
      (maxPanelSpace - maxPanelHeight) / 2 / maxPanelSpace
    );
  }

  return (
    <div ref={overlayRef} className={styles.overlay} onMouseDown={closePanel}>
      <div
        className={styles.searchPanel}
        onMouseDown={(e) => e.stopPropagation()}
        style={
          {
            "--panelHeight": `${maxPanelHeight}px`,
            "--panelMarginTop": `${maxPanelTopMargin.current * 100}%`,
          } as any
        }
      >
        {tabs}
        {searchError ? (
          <div className={styles.searchError}>
            <span>{searchError}</span>
            <a href={location.href}>Reload</a>
          </div>
        ) : (
          <>
            <div className={styles.searchInput}>
              <SearchIcon />
              <input
                ref={searchRef}
                type="text"
                value={searchValue}
                placeholder="Search..."
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>

            {searchResults?.results.length ? (
              <SearchResultsList
                indexes={indexes}
                searchResults={searchResults}
                inputRef={searchRef}
                onResultChosen={(result, isKeyboard) => {
                  if (isKeyboard) {
                    router.push(
                      indexes[result.indexId].renderers.getResultUrl(
                        result.doc
                      )
                    );
                  }
                  closePanel();
                }}
                onResultHeightChange={setResultsHeight}
                showBreadcrumbIndexName={selectedIndex === null}
                currentDocsVersion={currentDocsVersion}
              />
            ) : null}
          </>
        )}
      </div>

      <div className={styles.floatingCloseButton}>
        <CloseIcon />
      </div>
    </div>
  );
}

interface SearchResultsListProps {
  indexes: SearchIndexes;
  searchResults: IndexSearchReturn;
  inputRef: React.RefObject<HTMLInputElement>;
  onResultChosen: (result: IndexSearchResult, isKeyboard: boolean) => void;
  onResultHeightChange: (height: number) => void;
  showBreadcrumbIndexName: boolean;
  currentDocsVersion?: string;
}

function SearchResultsList({
  indexes,
  searchResults,
  inputRef,
  onResultChosen,
  onResultHeightChange,
  showBreadcrumbIndexName,
  currentDocsVersion,
}: SearchResultsListProps) {
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  const keyboardMode = useRef(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedResultIndex(0);
    if (resultsRef.current) {
      onResultHeightChange(
        resultsRef.current.scrollHeight - RESULT_SCROLL_PADDING
      );
    }
  }, [searchResults]);

  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        keyboardMode.current = true;
        setSelectedResultIndex(
          Math.max(
            0,
            Math.min(
              searchResults.results.length - 1,
              selectedResultIndex + (e.key === "ArrowUp" ? -1 : 1)
            )
          )
        );
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const result = searchResults?.results[selectedResultIndex];
        if (result) {
          onResultChosen(result, true);
        }
      }
    };

    inputRef.current?.addEventListener("keydown", keydownHandler);

    return () => {
      inputRef.current?.removeEventListener("keydown", keydownHandler);
    };
  });

  useEffect(() => {
    if (!keyboardMode.current) {
      return;
    }

    const resultEl = resultsRef.current?.querySelectorAll(
      `.${styles.searchResult}`
    )?.[selectedResultIndex];

    if (resultEl) {
      const scrollRect = resultsRef.current!.getBoundingClientRect();
      const resultRect = resultEl.getBoundingClientRect();

      let scrollDelta = 0;
      if (resultRect.bottom > scrollRect.bottom - RESULT_SCROLL_PADDING) {
        scrollDelta =
          resultRect.bottom - (scrollRect.bottom - RESULT_SCROLL_PADDING);
      }
      if (resultRect.top < scrollRect.top + RESULT_SCROLL_PADDING) {
        scrollDelta =
          resultRect.top - (scrollRect.top + RESULT_SCROLL_PADDING);
      }

      resultsRef.current!.scrollTop += scrollDelta;
    }
  }, [selectedResultIndex]);

  return (
    <div
      className={styles.results}
      ref={resultsRef}
      onMouseMove={() => (keyboardMode.current = false)}
    >
      {searchResults.results.map((result, i) => (
        <SearchResult
          indexes={indexes}
          result={result}
          key={result.indexId + result.id}
          query={searchResults.query}
          showBreadcrumbIndexName={showBreadcrumbIndexName}
          resultClicked={() => onResultChosen(result, false)}
          selected={selectedResultIndex === i}
          onMouseEnter={() => {
            if (!keyboardMode.current) {
              setSelectedResultIndex(i);
            }
          }}
          currentDocsVersion={currentDocsVersion}
        />
      ))}
      <div className={styles.scrollPadding} />
    </div>
  );
}

function getResultIcon(type: string) {
  switch (type) {
    case "function":
    case "operator":
      return <ResultIcons.FunctionResultIcon />;
    case "statement":
      return <ResultIcons.StatementResultIcon />;
    case "constraint":
      return <ResultIcons.ConstraintResultIcon />;
    case "type":
      return <ResultIcons.TypeResultIcon />;
  }
}

interface SearchResultProps {
  indexes: SearchIndexes;
  result: IndexSearchResult;
  query: IndexSearchReturn["query"];
  showBreadcrumbIndexName: boolean;
  resultClicked?: () => void;
  selected?: boolean;
  onMouseEnter?: () => void;
  currentDocsVersion?: string;
}

function SearchResult({
  indexes,
  result: {indexId, doc},
  query,
  showBreadcrumbIndexName,
  resultClicked,
  selected,
  onMouseEnter,
  currentDocsVersion,
}: SearchResultProps) {
  const renderers = indexes[indexId].renderers;

  const [title, body, breadcrumbs] = useMemo(() => {
    let breadcrumbs = renderers.getBreadcrumbs?.(doc);

    if (showBreadcrumbIndexName) {
      breadcrumbs = [indexes[indexId].name, ...(breadcrumbs ?? [])];
    }

    return [
      highlightMatches(doc.signature || doc.title || doc.name, query),
      highlightMatches(doc.summary || doc.content, query),
      breadcrumbs ? breadcrumbs.join(" › ") : undefined,
    ];
  }, [doc, query]);

  return (
    <Link href={renderers.getResultUrl(doc)}>
      <a
        className={cn(styles.searchResult, {
          [styles.resultSelected]: !!selected,
        })}
        onClick={resultClicked}
        onMouseEnter={onMouseEnter}
      >
        <div className={styles.resultHeader}>
          <div className={styles.resultTitle}>{title}</div>
          {currentDocsVersion &&
          doc.version &&
          currentDocsVersion <= doc.version ? (
            <div
              className={cn(styles.versionBadge, {
                [styles.warning]: currentDocsVersion !== doc.version,
              })}
            >
              {currentDocsVersion === doc.version
                ? "New"
                : `Added in ${doc.version}`}
            </div>
          ) : null}
          <div className={styles.resultBreadcrumbs}>{breadcrumbs}</div>
        </div>
        <div className={styles.resultBody}>{body}</div>
        {getResultIcon(doc.type)}
      </a>
    </Link>
  );
}

function highlightMatches(
  str: string | null,
  query: IndexSearchReturn["query"]
): JSX.Element[] {
  if (!str) {
    return [];
  }

  interface Part {
    str: string;
    isTerm: boolean;
  }

  const highlightTerm = (parts: Part[], term: string): Part[] => {
    const newParts: Part[] = [];
    for (let p of parts) {
      if (!p.isTerm) {
        const str = p.str;
        const strLower = str.toLowerCase();

        if (strLower.includes(term)) {
          let pos = 0;
          for (let sub of strLower.split(term)) {
            newParts.push({
              str: str.substr(pos, sub.length),
              isTerm: false,
            });
            pos += sub.length;

            newParts.push({
              str: str.substr(pos, term.length),
              isTerm: true,
            });
            pos += term.length;
          }
          newParts.pop();
          continue;
        }
      }
      newParts.push(p);
    }
    return newParts;
  };

  let parts: Part[] = [{str: str, isTerm: false}];
  for (const q of query) {
    parts = highlightTerm(parts, q.orig);
    parts = highlightTerm(parts, q.stripped);
    parts = highlightTerm(parts, q.stemmed);
  }

  return parts.map((part, i) => (
    <span key={i} className={part.isTerm ? styles.matchedTerm : undefined}>
      {part.str}
    </span>
  ));
}
