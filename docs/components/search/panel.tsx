"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  Fragment,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import cn from "@edgedb-site/shared/utils/classNames";

import type {
  IndexSearchResult,
  IndexSearchReturn,
} from "@edgedb-site/build-tools/jolr";

import { useDocVersion } from "@/hooks/docVersion";

import type { SearchIndexes } from "./indexDefs";
import * as searchWorker from "./worker";

import styles from "./search.module.scss";
import { SearchIcon, CloseIcon, ArrowRightIcon } from "./icons";

const RESULT_SCROLL_PADDING = 24;
const PANEL_BASE_HEIGHT = 88;
const PANEL_TABS_HEIGHT = 32;
const OVERLAY_PADDING = 48;

interface SearchPanelProps {
  indexes: SearchIndexes;
  initialTabId?: string;
  closePanel: () => void;
}

const filters = [
  { tabId: "all", indexId: null, label: "All", refnamePrefix: null },
  {
    tabId: "get-started",
    indexId: "docs",
    label: "Get Started",
    refnamePrefix: "/get-started/",
  },
  {
    tabId: "guides",
    indexId: "docs",
    label: "Guides",
    refnamePrefix: "/guides/",
  },
  { tabId: "cloud", indexId: "docs", label: "Cloud", refnamePrefix: "/cloud/" },
  // { tabId: "ui", indexId: "docs", label: "UI", refnamePrefix: "/ui/" },
  { tabId: "ai", indexId: "docs", label: "AI", refnamePrefix: "/ai/" },
  { tabId: "cli", indexId: "docs", label: "CLI", refnamePrefix: "/cli/" },
  {
    tabId: "client-libs",
    indexId: "docs",
    label: "Libraries",
    refnamePrefix: "/libraries/",
  },
  {
    tabId: "database",
    indexId: "docs",
    label: "Database",
    refnamePrefix: "/database/",
  },
  // { tabId: "qna", indexId: "qna", label: "Q&A", refnamePrefix: null },
  {
    tabId: "tutorial",
    indexId: "tutorial",
    label: "Tutorial",
    refnamePrefix: null,
  },
  { tabId: "book", indexId: "easyedb", label: "Book", refnamePrefix: null },
  {
    tabId: "changelog",
    indexId: "docs",
    label: "Changelog",
    refnamePrefix: "/changelog/",
  },
];

const clientFilters = [
  { id: "all", label: "All", refnamePrefix: "" },
  { id: "ts", label: "Typescript", refnamePrefix: "js/" },
  { id: "py", label: "Python", refnamePrefix: "python/" },
  { id: "go", label: "Go", refnamePrefix: "go/" },
  { id: "rust", label: "Rust", refnamePrefix: "rust/" },
  { id: "dart", label: "Dart", refnamePrefix: "dart/" },
  { id: "dotnet", label: ".Net", refnamePrefix: "dotnet/" },
  { id: "java", label: "Java", refnamePrefix: "java/" },
  { id: "elixir", label: "Elixir", refnamePrefix: "elixir/" },
  { id: "eqlhttp", label: "EdgeQL over HTTP", refnamePrefix: "http/" },
  { id: "gql", label: "GraphQL", refnamePrefix: "graphql/" },
];

const filterMapping = filters.reduce((mapping, filter, i) => {
  if (filter.indexId) {
    if (!mapping[filter.indexId]) mapping[filter.indexId] = [];
    mapping[filter.indexId].push({
      prefix: filter.refnamePrefix ?? "/",
      filterIndex: i,
    });
  }
  return mapping;
}, {} as { [indexId: string]: { prefix: string; filterIndex: number }[] });

export default function SearchPanel({
  indexes,
  initialTabId,
  closePanel,
}: SearchPanelProps) {
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // filters
  const [selectedFilterIndex, setSelectedFilterIndex] = useState(
    initialTabId ? filters.findIndex(({ tabId }) => tabId === initialTabId) : 0
  );
  const selectedFilter = filters[selectedFilterIndex];

  const [selectedClientFilterIndex, _setSelectedClientFilterIndex] = useState(
    () => {
      const id = localStorage.getItem("DocsSearchPreferredClient") ?? "all";
      return Math.max(
        0,
        clientFilters.findIndex((filter) => filter.id === id)
      );
    }
  );
  const setSelectedClientFilterIndex = useCallback(
    (filterIndex: number) => {
      _setSelectedClientFilterIndex(filterIndex);
      localStorage.setItem(
        "DocsSearchPreferredClient",
        clientFilters[filterIndex].id
      );
    },
    [_setSelectedClientFilterIndex]
  );
  const selectedClientFilter = clientFilters[selectedClientFilterIndex];

  // results

  const [searchResults, updateResults] = useState<IndexSearchReturn | null>(
    null
  );
  const [searchError, setSearchError] = useState("");

  const router = useRouter();
  const currentDocsVersion = useDocVersion()?.version;

  const allIndexIds = Object.keys(indexes);

  useEffect(() => {
    searchRef.current?.focus();

    searchWorker
      .preloadIndexes(allIndexIds.map((id) => ({ id, path: indexes[id].path })))
      .catch((err) => {
        setSearchError("Failed to load search indexes.");
      });
  }, allIndexIds);

  // useEffect(() => {
  //   if (overlayRef.current) {
  //     // @ts-ignore
  //     const observer = new ResizeObserver((entries) => {
  //       recordOverlayHeight(entries[0].target.clientHeight);
  //     });

  //     observer.observe(overlayRef.current);

  //     return () => {
  //       observer.disconnect();
  //     };
  //   }
  // }, [overlayRef]);

  useEffect(() => {
    if (searchValue) {
      searchWorker.search(searchValue, allIndexIds).then((result) => {
        if (result) {
          updateResults(result);
        }
      });
    } else {
      updateResults(null);
    }
  }, [searchValue]);

  const resultCounts = useMemo(() => {
    const counts = Array(filters.length).fill(0);
    counts[0] = searchResults?.results.length ?? 0;
    for (const res of searchResults?.results ?? []) {
      const path = indexes[res.indexId].renderers.getResultUrl(res.doc) + "/";
      for (const filter of filterMapping[res.indexId]) {
        if (path.startsWith(filter.prefix)) {
          counts[filter.filterIndex] += 1;
          break;
        }
      }
    }
    return counts;
  }, [searchResults?.results]);

  return (
    <div
      className={styles.searchPanel}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      // style={
      //   {
      //     "--panelHeight": `${maxPanelHeight}px`,
      //     "--panelMarginTop": `${maxPanelTopMargin.current * 100}%`,
      //   } as any
      // }
    >
      <div className={styles.header}>
        <div className={styles.closeButton} onClick={() => closePanel()}>
          <CloseIcon />
        </div>
      </div>

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
      <div className={styles.filtersRow}>
        <div className={styles.filtersInner}>
          {filters.map((filter, i) => (
            <div
              key={i}
              className={cn(styles.filterTab, {
                [styles.selected]: selectedFilterIndex === i,
                [styles.noResults]:
                  searchResults != null && resultCounts[i] === 0,
              })}
              onClick={() => setSelectedFilterIndex(i)}
            >
              {filter.label}
              {searchResults ? (
                <span className={styles.filterCount}>
                  {resultCounts[i] > 99 ? "99+" : resultCounts[i]}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      {selectedFilter.refnamePrefix === "/libraries/" ? (
        <div className={cn(styles.filtersRow, styles.clientsFilters)}>
          <div className={styles.filtersInner}>
            {clientFilters.map((filter, i) => (
              <div
                key={i}
                className={cn(styles.filterTab, {
                  [styles.selected]: selectedClientFilterIndex === i,
                })}
                onClick={() => setSelectedClientFilterIndex(i)}
              >
                {filter.label}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {searchResults?.results.length ? (
        <SearchResultsList
          indexes={indexes}
          searchResults={searchResults}
          indexIdFilter={selectedFilter.indexId}
          refnamePrefixFilter={
            selectedFilter.refnamePrefix === "/libraries/"
              ? `/libraries/${selectedClientFilter.refnamePrefix}`
              : selectedFilter.refnamePrefix
          }
          inputRef={searchRef}
          onResultChosen={(result, isKeyboard) => {
            closePanel();
            if (isKeyboard) {
              router.push(
                indexes[result.indexId].renderers.getResultUrl(result.doc)
              );
            }
          }}
          onResultHeightChange={() => {
            /*setResultsHeight*/
          }}
          currentDocsVersion={currentDocsVersion}
        />
      ) : null}
    </div>
  );
}

// export function _SearchPanel({ indexes, closePanel }: SearchPanelProps) {
//   const [searchValue, setSearchValue] = useState("");

//   const [searchResults, updateResults] = useState<IndexSearchReturn | null>(
//     null
//   );
//   const [searchError, setSearchError] = useState("");

//   const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

//   const [overlayHeight, recordOverlayHeight] = useState(0);
//   const [resultsHeight, setResultsHeight] = useState(0);

//   const searchRef = useRef<HTMLInputElement>(null);
//   const overlayRef = useRef<HTMLDivElement>(null);

//   const maxPanelTopMargin = useRef(0.15);

//   const router = useRouter();

//   const currentDocsVersion = useDocVersion()?.version;

//   const indexIds = Object.keys(indexes);

//   useEffect(() => {
//     searchRef.current?.focus();

//     searchWorker
//       .preloadIndexes(indexIds.map((id) => ({ id, path: indexes[id].path })))
//       .catch((err) => {
//         setSearchError("Failed to load search indexes.");
//       });
//   }, [indexIds]);

//   useEffect(() => {
//     if (overlayRef.current) {
//       // @ts-ignore
//       const observer = new ResizeObserver((entries) => {
//         recordOverlayHeight(entries[0].target.clientHeight);
//       });

//       observer.observe(overlayRef.current);

//       return () => {
//         observer.disconnect();
//       };
//     }
//   }, [overlayRef]);

//   useEffect(() => {
//     if (searchValue) {
//       searchWorker
//         .search(searchValue, selectedIndex ? [selectedIndex] : indexIds)
//         .then((result) => {
//           if (result) {
//             updateResults(result);
//           }
//         });
//     } else {
//       updateResults(null);
//     }
//   }, [searchValue, selectedIndex]);

//   let tabs: JSX.Element | null = null;
//   if (indexIds.length > 1) {
//     tabs = (
//       <div className={styles.tabs}>
//         <div
//           key="all"
//           className={cn(styles.tab, {
//             [styles.selectedTab]: selectedIndex === null,
//           })}
//           onClick={() => setSelectedIndex(null)}
//         >
//           All
//         </div>
//         {indexIds.map((indexId) => (
//           <div
//             key={indexId}
//             className={cn(styles.tab, {
//               [styles.selectedTab]: selectedIndex === indexId,
//             })}
//             onClick={() => setSelectedIndex(indexId)}
//           >
//             {indexes[indexId].name}
//           </div>
//         ))}
//       </div>
//     );
//   }

//   const maxPanelSpace = overlayHeight - OVERLAY_PADDING * 2;
//   const panelHeight = PANEL_BASE_HEIGHT + (tabs ? PANEL_TABS_HEIGHT : 0);

//   const maxPanelHeight = Math.min(
//     panelHeight + (searchResults?.results.length ? resultsHeight : 0),
//     maxPanelSpace
//   );

//   if (overlayHeight) {
//     maxPanelTopMargin.current = Math.min(
//       maxPanelTopMargin.current,
//       (maxPanelSpace - maxPanelHeight) / 2 / maxPanelSpace
//     );
//   }

//   return (
//     <div ref={overlayRef} className={styles.overlay} onMouseDown={closePanel}>
//       <div
//         className={styles.searchPanel}
//         onMouseDown={(e) => e.stopPropagation()}
//         style={
//           {
//             "--panelHeight": `${maxPanelHeight}px`,
//             "--panelMarginTop": `${maxPanelTopMargin.current * 100}%`,
//           } as any
//         }
//       >
//         {tabs}
//         {searchError ? (
//           <div className={styles.searchError}>
//             <span>{searchError}</span>
//             <a href={location.href}>Reload</a>
//           </div>
//         ) : (
//           <>
//             <div className={styles.searchInput}>
//               <SearchIcon />
//               <input
//                 ref={searchRef}
//                 type="text"
//                 value={searchValue}
//                 placeholder="Search..."
//                 onChange={(e) => setSearchValue(e.target.value)}
//               />
//             </div>

//             {searchResults?.results.length ? (
//               <SearchResultsList
//                 indexes={indexes}
//                 searchResults={searchResults}
//                 inputRef={searchRef}
//                 onResultChosen={(result, isKeyboard) => {
//                   if (isKeyboard) {
//                     router.push(
//                       indexes[result.indexId].renderers.getResultUrl(result.doc)
//                     );
//                   }
//                   closePanel();
//                 }}
//                 onResultHeightChange={setResultsHeight}
//                 showBreadcrumbIndexName={selectedIndex === null}
//                 currentDocsVersion={currentDocsVersion}
//               />
//             ) : null}
//           </>
//         )}
//       </div>

//       <div className={styles.floatingCloseButton}>
//         <CloseIcon />
//       </div>
//     </div>
//   );
// }

interface SearchResultsListProps {
  indexes: SearchIndexes;
  searchResults: IndexSearchReturn;
  inputRef: React.RefObject<HTMLInputElement>;
  onResultChosen: (result: IndexSearchResult, isKeyboard: boolean) => void;
  onResultHeightChange: (height: number) => void;
  currentDocsVersion?: string;
  indexIdFilter: string | null;
  refnamePrefixFilter: string | null;
}

function SearchResultsList({
  indexes,
  searchResults,
  inputRef,
  onResultChosen,
  onResultHeightChange,
  currentDocsVersion,
  indexIdFilter,
  refnamePrefixFilter,
}: SearchResultsListProps) {
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  const keyboardMode = useRef(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    let results = searchResults.results;
    if (indexIdFilter) {
      results = results.filter((res) => res.indexId === indexIdFilter);
    }
    if (refnamePrefixFilter) {
      results = results.filter((res) =>
        (indexes[res.indexId].renderers.getResultUrl(res.doc) + "/").startsWith(
          refnamePrefixFilter
        )
      );
    }
    return results;
  }, [searchResults, indexIdFilter, refnamePrefixFilter]);

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
              results.length - 1,
              selectedResultIndex + (e.key === "ArrowUp" ? -1 : 1)
            )
          )
        );
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const result = results[selectedResultIndex];
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
        scrollDelta = resultRect.top - (scrollRect.top + RESULT_SCROLL_PADDING);
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
      {results.map((result, i) => (
        <SearchResult
          indexes={indexes}
          result={result}
          key={result.indexId + result.id}
          query={searchResults.query}
          breadcrumbDepth={
            indexIdFilter
              ? refnamePrefixFilter
                ? refnamePrefixFilter != "/database/"
                  ? refnamePrefixFilter.replace(/^\/|\/$/g, "").split("/")
                      .length
                  : 0
                : 1
              : 0
          }
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

interface SearchResultProps {
  indexes: SearchIndexes;
  result: IndexSearchResult;
  query: IndexSearchReturn["query"];
  breadcrumbDepth: number;
  resultClicked?: () => void;
  selected?: boolean;
  onMouseEnter?: () => void;
  currentDocsVersion?: string;
}

function SearchResult({
  indexes,
  result: { indexId, doc },
  query,
  breadcrumbDepth,
  resultClicked,
  selected,
  onMouseEnter,
  currentDocsVersion,
}: SearchResultProps) {
  const renderers = indexes[indexId].renderers;

  const [title, body, breadcrumbs] = useMemo(() => {
    let breadcrumbs = renderers.getBreadcrumbs?.(doc);

    return [
      highlightMatches(doc.signature || doc.title || doc.name, query),
      highlightMatches(doc.summary || doc.content, query),
      breadcrumbs,
    ];
  }, [doc, query]);

  return (
    <Link
      href={renderers.getResultUrl(doc)}
      className={cn(styles.searchResult, {
        [styles.resultSelected]: !!selected,
      })}
      onClick={resultClicked}
      onMouseEnter={onMouseEnter}
    >
      <div className={styles.resultHeaderWrapper}>
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
        </div>
        <div className={styles.resultBreadcrumbs}>
          {breadcrumbs?.slice(breadcrumbDepth).map((crumb, i, crumbs) => (
            <Fragment key={i}>
              <span>{crumb}</span>
              {i < crumbs.length - 1 ? " › " : ""}
            </Fragment>
          ))}
        </div>
      </div>
      <div className={styles.resultBody}>{body}</div>
      <ArrowRightIcon className={styles.arrowIcon} />
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

  let parts: Part[] = [{ str: str, isTerm: false }];
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
