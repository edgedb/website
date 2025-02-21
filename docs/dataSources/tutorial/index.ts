import {
  TutorialNavData,
  TutorialStaticData,
} from "@edgedb-site/shared/tutorial/types";
import { getSourceData } from "../utils";

import { redirect } from "next/navigation";

async function loadTutorialData() {
  return (await getSourceData([
    "tutorial",
    "edb-tutorial",
  ])) as TutorialStaticData;
}

async function loadTutorialNavData() {
  return (await getSourceData(["tutorial", "navData"])) as TutorialNavData;
}

export async function getTutorialPaths() {
  const data = await loadTutorialNavData();
  const paths = [{ path: [""] }];
  for (const [sectionSlug, section] of Object.entries(data)) {
    paths.push({
      path: [sectionSlug],
    });
    for (const [catSlug, cat] of Object.entries(section.categories)) {
      paths.push({
        path: [sectionSlug, catSlug],
      });
      for (const pageSlug of Object.keys(cat.pages)) {
        paths.push({
          path: [sectionSlug, catSlug, pageSlug],
        });
      }
    }
  }
  return paths;
}

export async function getTutorialPage(path: string[]) {
  const [data, nav] = await Promise.all([
    loadTutorialData(),
    loadTutorialNavData(),
  ]);

  const secSlug = path[0] || Object.keys(nav)[0];
  const catSlug = path[1] || Object.keys(nav[secSlug].categories)[0];
  const category = nav[secSlug].categories[catSlug];

  const pageSlug = path[2] || Object.keys(category.pages)[0];

  const pageId = `${secSlug}/${catSlug}/${pageSlug}`;

  const page = data.pages[pageId];

  if (path.join("/") !== page.relname) {
    throw redirect(`/tutorial/${page.relname}`);
  }

  const pageList = Object.keys(data.pages);
  const currentPageIndex = pageList.indexOf(pageId);
  const prevPage = pageList[currentPageIndex - 1];
  const nextPage = pageList[currentPageIndex + 1];

  const [nextSection, nextCategory] = nextPage?.split("/") ?? [];

  return {
    page: {
      id: pageId,
      ...page,
    },
    category: {
      title: category.title,
      pages: Object.keys(category.pages).map(
        (pageSlug) => data.pages[`${secSlug}/${catSlug}/${pageSlug}`]
      ),
    },
    prefetchedData: data.prefetchedResults[pageId],
    protocolVersion: data.protocolVersion,
    prevPage: prevPage
      ? {
          path: prevPage,
        }
      : null,
    nextPage: nextPage
      ? {
          path: nextPage,
          categoryTitle:
            secSlug !== nextSection || catSlug !== nextCategory
              ? nav[nextSection].categories[nextCategory].title
              : undefined,
        }
      : null,
  };
}

export async function getTutorialTocData() {
  const nav = await loadTutorialNavData();

  return Object.entries(nav).map(([secSlug, section], si) => ({
    title: section.title,
    categories: Object.entries(section.categories).map(
      ([catSlug, category], ci) => ({
        title: category.title,
        href: `/tutorial${
          si === 0 && ci === 0 ? "" : `/${secSlug}/${catSlug}`
        }`,
      })
    ),
  }));
}

export type TutorialTocData = Awaited<ReturnType<typeof getTutorialTocData>>;
