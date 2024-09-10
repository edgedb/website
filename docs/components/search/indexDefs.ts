import { IndexSearchResult } from "@edgedb-site/build-tools/jolr";

// import {getNavData} from "@/components/docs/nav/navTree";

export type SearchIndexes = {
  [id: string]: {
    path: string;
    renderers: {
      getResultUrl: (doc: IndexSearchResult["doc"]) => string;
      // getBreadcrumbs?: (doc: IndexSearchResult["doc"]) => string[];
    };
  };
};

export function getDocsIndexDef(): SearchIndexes {
  const docsIndexPath = require(`@/build-cache/docs/docsearch.jolrindex`);
  // const {urlMapping} = getNavData();

  return {
    docs: {
      path: docsIndexPath,
      renderers: {
        getResultUrl: (doc: IndexSearchResult["doc"]) => {
          return `${doc.relname}${doc.target ? `#${doc.target}` : ""}`;
        },
        // getBreadcrumbs: (doc: IndexSearchResult["doc"]) => {
        //   return [];
        //   // const breadcrumbs: string[] = [];
        //   // let navTreeItem = urlMapping.get(doc.relname);
        //   // while (navTreeItem) {
        //   //   breadcrumbs.push(navTreeItem.title);
        //   //   navTreeItem = navTreeItem.parent;
        //   // }
        //   // return breadcrumbs.slice(-2).reverse();
        // },
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
        // getBreadcrumbs: (doc: IndexSearchResult["doc"]) => {
        //   const [section, category] = doc.relname.split("/");
        //   return [
        //     tutorialNavData[section].name,
        //     tutorialNavData[section].categories[category],
        //   ];
        // },
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
        // getBreadcrumbs: (doc: IndexSearchResult["doc"]) => {
        //   const chapterNo = doc.relname.slice(8);
        //   return [chapterNo ? `Chapter ${chapterNo}` : "Welcome"];
        // },
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
