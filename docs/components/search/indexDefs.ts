import type { DocsBreadcrumbs } from "@/dataSources/docs/nav";
import { IndexSearchResult } from "@edgedb-site/build-tools/jolr";

export type SearchIndexes = {
  [id: string]: {
    path: string;
    renderers: {
      getResultUrl: (doc: IndexSearchResult["doc"]) => string;
      getBreadcrumbs?: (doc: IndexSearchResult["doc"]) => string[];
    };
  };
};

export function getDocsIndexDef(
  docsBreadcrumbs: DocsBreadcrumbs
): SearchIndexes {
  const docsIndexPath = require(`@/build-cache/docs/docsearch.jolrindex`);

  return {
    docs: {
      path: docsIndexPath,
      renderers: {
        getResultUrl: (doc: IndexSearchResult["doc"]) => {
          return `${doc.relname}${doc.target ? `#${doc.target}` : ""}`;
        },
        getBreadcrumbs: (doc: IndexSearchResult["doc"]) => {
          const crumbs = [];
          let currentBreadcrumbs = docsBreadcrumbs;
          let path = "";
          for (const part of doc.relname.split("/").slice(1)) {
            path = `${path}/${part}`;
            if (currentBreadcrumbs[path]) {
              crumbs.push(currentBreadcrumbs[path].title);
              currentBreadcrumbs = currentBreadcrumbs[path].children ?? {};
              path = "";
            }
          }
          return crumbs;
        },
      },
    },
  };
}

export function getTutorialIndexDef(): SearchIndexes {
  const tutorialIndexPath = require("@/build-cache/tutorial/tutorialsearch.jolrindex");
  const tutorialNavData = require("@/build-cache/tutorial/navData.json");

  return {
    tutorial: {
      path: tutorialIndexPath,
      renderers: {
        getResultUrl: (doc: IndexSearchResult["doc"]) => {
          return `/tutorial${doc.relname}`;
        },
        getBreadcrumbs: (doc: IndexSearchResult["doc"]) => {
          const [section, category] = doc.relname.slice(1).split("/");
          if (!section) {
            return ["Tutorial", "Introduction"];
          }
          return [
            "Tutorial",
            tutorialNavData[section].title,
            tutorialNavData[section].categories[category].title,
          ];
        },
      },
    },
  };
}

export function getEasyEDBIndexDef(lang: string): SearchIndexes {
  const easyedbIndexPath = require(`@/build-cache/easyedb/${lang}/easyedbsearch.jolrindex`);

  return {
    easyedb: {
      path: easyedbIndexPath,
      renderers: {
        getResultUrl: (doc: IndexSearchResult["doc"]) => {
          return `/easy-edgedb${lang !== "en" ? `/${lang}` : ""}${doc.relname}${
            doc.target ? `#${doc.target}` : ""
          }`;
        },
        getBreadcrumbs: (doc: IndexSearchResult["doc"]) => {
          const chapterNo = doc.relname.slice(8);
          return ["Book", chapterNo ? `Chapter ${chapterNo}` : "Welcome"];
        },
      },
    },
  };
}

export function getQnAIndexDef(): SearchIndexes {
  return {
    qna: {
      path: "/q+a/search-index",
      renderers: {
        getResultUrl: (doc: IndexSearchResult["doc"]) => {
          return `/q+a${doc.relname}`;
        },
      },
    },
  };
}
