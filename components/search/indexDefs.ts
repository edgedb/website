import {IndexSearchResult} from "@edgedb/site-build-tools/jolr";

import {getNavData} from "@/components/docs/nav/navTree";

export function getDocsIndexDef() {
  const docsIndexPath = require(`@/build-cache/docs/docsearch.jolrindex`);
  const {urlMapping} = getNavData();

  return {
    docs: {
      name: "Docs",
      path: docsIndexPath,
      renderers: {
        getResultUrl: (doc: IndexSearchResult["doc"]) => {
          return `/docs/${doc.relname}${doc.target ? `#${doc.target}` : ""}`;
        },
        getBreadcrumbs: (doc: IndexSearchResult["doc"]) => {
          const breadcrumbs: string[] = [];
          let navTreeItem = urlMapping.get(doc.relname);
          while (navTreeItem) {
            breadcrumbs.push(navTreeItem.title);
            navTreeItem = navTreeItem.parent;
          }
          return breadcrumbs.slice(-2).reverse();
        },
      },
    },
  };
}

export function getTutorialIndexDef() {
  const tutorialIndexPath = require("@/build-cache/tutorial/tutorialsearch.jolrindex");
  const tutorialNavData = require("@/build-cache/tutorial/navData.json");

  return {
    tutorial: {
      name: "Tutorial",
      path: tutorialIndexPath,
      renderers: {
        getResultUrl: (doc: IndexSearchResult["doc"]) => {
          return `/tutorial/${doc.relname}`;
        },
        getBreadcrumbs: (doc: IndexSearchResult["doc"]) => {
          const [section, category] = doc.relname.split("/");
          return [
            tutorialNavData[section].name,
            tutorialNavData[section].categories[category],
          ];
        },
      },
    },
  };
}

export function getEasyEDBIndexDef(lang: string) {
  const easyedbIndexPath = require(`@/build-cache/easyedb/${lang}/easyedbsearch.jolrindex`);

  return {
    easyedb: {
      name: "Book",
      path: easyedbIndexPath,
      renderers: {
        getResultUrl: (doc: IndexSearchResult["doc"]) => {
          return `/easy-edgedb${lang !== "en" ? `/${lang}` : ""}${
            doc.relname
          }${doc.target ? `#${doc.target}` : ""}`;
        },
        getBreadcrumbs: (doc: IndexSearchResult["doc"]) => {
          const chapterNo = doc.relname.slice(8);
          return [chapterNo ? `Chapter ${chapterNo}` : "Welcome"];
        },
      },
    },
  };
}
