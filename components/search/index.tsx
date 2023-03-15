import {PropsWithChildren, useEffect} from "react";
import Head from "next/head";

import {IndexSearchResult} from "@edgedb/site-build-tools/jolr";

import {useOverlayActive} from "hooks/useOverlayActive";

import {SearchContext} from "./context";

export type SearchIndexes = {
  [id: string]: {
    name: string;
    path: string;
    renderers: {
      getResultUrl: (doc: IndexSearchResult["doc"]) => string;
      getBreadcrumbs?: (doc: IndexSearchResult["doc"]) => string[];
    };
  };
};

export function SearchProvider({children}: PropsWithChildren<{}>) {
  const [panelOpen, setPanelOpen] = useOverlayActive("SearchProvider");

  useEffect(() => {
    const globalKeyListener = (e: KeyboardEvent) => {
      if (e.key === "/" && !panelOpen) {
        e.preventDefault();
        setPanelOpen(true);
      }
      if (e.key === "Escape" && panelOpen) {
        e.preventDefault();
        setPanelOpen(false);
      }
    };

    window.addEventListener("keydown", globalKeyListener);

    return () => {
      window.removeEventListener("keydown", globalKeyListener);
    };
  });

  return (
    <SearchContext.Provider value={{panelOpen, setPanelOpen}}>
      {children}
    </SearchContext.Provider>
  );
}

export function IndexPrefetch({indexes}: {indexes: SearchIndexes}) {
  return (
    <Head>
      {Object.entries(indexes).map(([id, {path}]) => (
        <link
          key={`searchIndex-${id}`}
          rel="prefetch"
          as="fetch"
          type="application/json"
          href={path}
        />
      ))}
    </Head>
  );
}
