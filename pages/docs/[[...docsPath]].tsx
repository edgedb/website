import {GetStaticPaths, GetStaticProps} from "next";

import {
  getDocsPaths,
  getDocsDocument,
  DocsDocumentData,
} from "dataSources/docs/index";

import {renderDocument} from "@/components/xmlRenderer";
import {
  docsRenderComponents,
  docsReactComponents,
} from "@/components/xmlRenderer/docsComponents";

import DocsLayout from "@/components/layouts/docs";

import {
  DocVersionContext,
  DocVersionProvider,
} from "@/components/docs/docVersionContext";
import DocsNav from "@/components/docs/nav";

import ThemeSwitcher from "@/components/docs/themeSwitcher";

import {SearchProvider} from "@/components/search";
import {SearchMiniButton, SearchNoteButton} from "@/components/search/buttons";
import Search from "@/components/search/search";

import styles from "@/styles/docs.module.scss";
import MetaTags from "@/components/metatags";
import {getNavData} from "@/components/docs/nav/navTree";
import ArrowButton, {ArrowButtonProps} from "@/components/arrowButton";
import {CodeTabContextProvider} from "@/components/code/tabs";
import ToC from "@/components/toc";
import {useMemo} from "react";

type PageParams = {
  docsPath: string[];
};

type PageProps = DocsDocumentData;

const metaImageCards = [
  "changelog",
  "cli",
  "clients",
  "datamodel",
  "edgeql",
  "graphql",
  "guides",
  "intro",
  "reference",
  "stdlib",
];

export default function DocsPage({doc}: PageProps) {
  const {urlMapping} = getNavData();
  const navItem = urlMapping.get(doc.id);
  let title = navItem
    ? `${doc.title || navItem.title}${
        navItem.parent ? ` — ${navItem.parent?.title}` : ""
      }`
    : doc.title || "Documentation";
  title = title.split("#")[0];

  let prevNavItem: ArrowButtonProps | null = null;
  if (navItem?.previous) {
    const prev = navItem.previous;
    prevNavItem = {
      href: "/docs/" + prev.uri,
      label: prev.title,
      subLabel: prev.parent?.title || "",
      direction: "left",
    };
  }

  let nextNavItem: ArrowButtonProps | null = null;
  if (navItem?.next) {
    const next = navItem.next;
    nextNavItem = {
      href: "/docs/" + next.uri,
      label: next.title,
      subLabel: next.parent?.title || "",
    };
  }

  const docsSection = doc.id.split("/")[0];
  const docsHeaders = useMemo(() => doc.headers.filter((h) => h.level === 2), [
    doc,
  ]);

  if (doc.versioning.page || doc.versioning.anchors) {
    console.log(doc.versioning);
  }

  return (
    <DocVersionProvider>
      <SearchProvider>
        <MetaTags
          title={title}
          description={``}
          relPath={doc.id === "intro/index" ? "/docs" : `/docs/${doc.id}`}
          siteTitle={"EdgeDB Docs"}
          imagePath={`/assets/docs_cards/${
            metaImageCards.includes(docsSection) ? docsSection : "generic"
          }.png`}
        />
        <DocsLayout
          className={styles.page}
          htmlClassName={styles.root}
          pageBackgroundColour={{light: "#f7f7f7", dark: "#2c2d2e"}}
          nav={<DocsNav />}
          sidebar={
            docsHeaders.length >= 3 ? (
              <DocVersionContext.Consumer>
                {({version}) => (
                  <ToC
                    headers={doc.headers
                      .filter((h) => h.level === 2)
                      .map((h) => ({
                        ...h,
                        title: h.title,
                        badge: h.versionAdded === version ? "New" : undefined,
                        faded: !!h.versionAdded && h.versionAdded > version,
                      }))}
                    sectionSelector={`.${styles.section}`}
                  />
                )}
              </DocVersionContext.Consumer>
            ) : undefined
          }
          headerInjectComponent={
            <>
              <SearchNoteButton />
              <SearchMiniButton />
            </>
          }
        >
          <CodeTabContextProvider>
            {renderDocument(
              doc.document,
              styles,
              docsRenderComponents,
              docsReactComponents
            )}
          </CodeTabContextProvider>
          <div className={styles.footerNav}>
            {prevNavItem ? <ArrowButton {...prevNavItem} /> : <div />}
            {nextNavItem ? <ArrowButton {...nextNavItem} /> : <div />}
          </div>
          <ThemeSwitcher className={styles.themeSwitcher} />
        </DocsLayout>
        <Search />
      </SearchProvider>
    </DocVersionProvider>
  );
}

export const getStaticProps: GetStaticProps<PageProps, PageParams> = async ({
  params,
}) => {
  return {
    props: await getDocsDocument(params!.docsPath),
  };
};

export const getStaticPaths: GetStaticPaths<PageParams> = async () => {
  const docsPaths = await getDocsPaths();

  return {
    paths: docsPaths.map((docsPath) => ({
      params: {docsPath},
    })),

    fallback: false,
  };
};
