import {promises as fs} from "fs";

import {GetStaticPaths, GetStaticProps} from "next";

import cn from "@/utils/classNames";
import MainLayout from "@/components/layouts/main";

import {Provider} from "react-redux";
import {State, NextPrevPage, TutorialStaticData} from "tutorial/types";
import store from "tutorial/store";

import Page from "@/components/tutorial/page";
import TutorialControls from "@/components/tutorial/controls";
import TutorialTOC, {TutorialTocProvider} from "@/components/tutorial/toc";
import Schema, {SchemaViewProvider} from "@/components/tutorial/schema";

import {SearchProvider} from "@/components/search";
import {SearchMiniButton, SearchNoteButton} from "@/components/search/buttons";
import Search from "@/components/search/search";

import styles from "@/styles/tutorial.module.scss";

import {enableMapSet} from "immer";
import MetaTags from "@/components/metatags";
enableMapSet();

async function loadTutorialData(): Promise<TutorialStaticData> {
  const file = await fs.readFile(
    ".build-cache/tutorial/edb-tutorial.json",
    "utf8"
  );
  return JSON.parse(file);
}

type PageParams = {
  path: string[];
};

type PageProps = PageParams;

export default function TutorialPage({path}: PageProps) {
  const state = store.getState();

  const pagePath = normalizePath(state, path);
  const [prev, next] = getNextPrev(state, pagePath);

  const [sectionSlug, categorySlug] = pagePath.split("/");

  const page = state.pages.get(pagePath)!;
  const section = state.sections.get(sectionSlug)!;
  const category = section.categories.get(categorySlug)!;
  const categoryPages = category.pages.map(
    (pagePath) => state.pages.get(pagePath)!
  );

  return (
    <SearchProvider>
      <MainLayout
        className={styles.page}
        footerClassName={styles.footer}
        pageBackgroundColour={{light: "#f7f7f7", dark: "#2c2d2e"}}
        headerInjectComponent={
          <>
            <SearchNoteButton />
            <SearchMiniButton />
          </>
        }
      >
        <MetaTags
          title={`${
            page.title === "Hello"
              ? "Interactive EdgeQL Tutorial"
              : `${page.title} - Interactive EdgeQL Tutorial`
          }`}
          description={`Try EdgeDB directly from your browser! No installations required.`}
          relPath={`/tutorial/${page.path}`}
        />
        <Provider store={store}>
          <TutorialTocProvider>
            <SchemaViewProvider>
              <div className={cn("globalPageWrapper", styles.pageContent)}>
                <div className={styles.toc}>
                  <TutorialTOC
                    activeSection={sectionSlug}
                    activeCategory={categorySlug}
                  />
                </div>
                <div className={styles.content}>
                  <Page
                    page={page}
                    category={category}
                    categoryPages={categoryPages}
                    prev={prev}
                    next={next}
                  />
                </div>
                <TutorialControls pagePath={pagePath} />
              </div>
              <Schema />
              <Search defaultIndexId="tutorial" />
            </SchemaViewProvider>
          </TutorialTocProvider>
        </Provider>
      </MainLayout>
    </SearchProvider>
  );
}

export const getStaticPaths: GetStaticPaths<PageParams> = async () => {
  const data = await loadTutorialData();
  const paths = [{params: {path: [""]}}];
  for (const section of data.sections) {
    paths.push({
      params: {path: [section.slug]},
    });
    for (const cat of section.categories) {
      paths.push({
        params: {path: [section.slug, cat.slug]},
      });
      for (const page of cat.pages) {
        paths.push({
          params: {path: [section.slug, cat.slug, page.slug]},
        });
      }
    }
  }

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PageProps, PageParams> = async ({
  params,
}) => {
  return {
    props: {
      path: params!.path ?? [(await loadTutorialData()).sections[0].slug],
    },
  };
};

function normalizePath(state: State, path: string[]): string {
  let [sectionSlug, categorySlug, pageSlug] = path;

  if (pageSlug) {
    return path.join("/");
  }

  const section = sectionSlug
    ? state.sections.get(sectionSlug)!
    : state.sections.values().next().value;

  const category = categorySlug
    ? section.categories.get(categorySlug)!
    : section.categories.values().next().value;

  return category.pages[0];
}

function getNextPrev(
  state: State,
  path: string
): [NextPrevPage | null, NextPrevPage | null] {
  const pagePaths = [...state.pages.keys()];

  const currentIndex = pagePaths.indexOf(path)!;

  const [currentSection, currentCategory] = path.split("/");

  const prev = pagePaths[currentIndex - 1];
  const next = pagePaths[currentIndex + 1];

  const [nextSection, nextCategory] = next?.split("/") ?? [];

  return [
    prev
      ? {
          path: prev,
        }
      : null,
    next
      ? {
          path: next,
          categoryTitle:
            currentSection !== nextSection || currentCategory !== nextCategory
              ? state.sections.get(nextSection)!.categories.get(nextCategory)!
                  .category
              : undefined,
        }
      : null,
  ];
}
