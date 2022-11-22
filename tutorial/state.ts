import {
  TutorialStaticData,
  CellState,
  SectionState,
  State,
  CategoryState,
  PageState,
} from "./types";

import data from "@/build-cache/tutorial/edb-tutorial.json";
import {getReducer} from "./reducers";

let _cellIdGen = 0;

function generateInitialState(data: TutorialStaticData) {
  const cells: Map<number, CellState> = new Map();
  const pages: Map<string, PageState> = new Map();

  const secsState: Map<string, SectionState> = new Map();
  for (const section of data.sections) {
    const catsState: Map<string, CategoryState> = new Map();

    for (const category of section.categories) {
      const pagesState: string[] = [];

      for (const page of category.pages) {
        const pagePath = `${section.slug}/${category.slug}/${page.slug}`;
        const prefetchedResults = data.prefetchedResults[pagePath] || null;

        const cellIds: number[] = [];

        for (const cell of page.cells) {
          const id = _cellIdGen++;

          cellIds.push(id);

          if (cell.kind === "text") {
            cells.set(id, {
              id,
              kind: "text",
              content: cell.text,
            });
          } else {
            const text = cell.text.trim();

            cells.set(id, {
              id,
              kind: "edgeql",
              mode: "binary",
              text,
              initialText: text,
              result: null,
              resultOutdated: false,
              errorInCell: null,
            });
          }
        }

        pages.set(pagePath, {
          path: pagePath,
          title: page.title,
          slug: page.slug,
          cells: cellIds,
          prefetchedResults: prefetchedResults,
        });

        pagesState.push(pagePath);
      }

      catsState.set(category.slug, {
        category: category.category,
        slug: category.slug,
        pages: pagesState,
      });
    }

    secsState.set(section.slug, {
      title: section.title,
      slug: section.slug,
      categories: catsState,
    });
  }

  const newState: State = {
    cells,
    pages,
    sections: secsState,
    running: false,
    exception: null,
    protocolVersion: data.protocolVersion,
    defaultMode: "binary",
  };

  return newState;
}

export const reducer = getReducer(
  generateInitialState((data as any) as TutorialStaticData)
);
