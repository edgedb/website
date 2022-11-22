import {useLayoutEffect, useRef} from "react";
import {useSelector} from "react-redux";

import cn from "@/utils/classNames";

import FooterNav from "@/components/tutorial/footerNav";

import TextCell from "@/components/tutorial/textcell";
import CodeCell from "@/components/tutorial/codecell";
import TutorialPageNav from "@/components/tutorial/pageNav";

import {State, NextPrevPage, PageState, CategoryState} from "tutorial/types";

import styles from "styles/tutorial.module.scss";

const useBrowserLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : () => {};

interface PageProps {
  page: PageState;
  category: CategoryState;
  categoryPages: PageState[];
  prev: NextPrevPage | null;
  next: NextPrevPage | null;
}

export default function Page({
  page,
  category,
  categoryPages,
  prev,
  next,
}: PageProps) {
  const isRunning = useSelector((state: State) => state.running);

  const cellsRef = useRef<HTMLDivElement>(null);

  const pinnedCell = useRef<{
    el: HTMLElement;
    rect: DOMRect;
  } | null>(null);

  // To prevent the page jumping when the cells are run, this hook records the
  // bounding rect of the cell that is at the top of the page (ie. it's bounding
  // rect intersects the top of the viewport) when the action is triggered, then
  // updates the page's scrollTop after the run is complete to keep the top of
  // the 'pinned cell' in the same place relative to the top of the viewport
  useBrowserLayoutEffect(() => {
    if (isRunning === true) {
      if (cellsRef.current) {
        const cellsRect = cellsRef.current.getBoundingClientRect();
        if (cellsRect.top > 0) {
          return;
        }
        if (cellsRect.bottom < 0) {
          pinnedCell.current = {
            el: cellsRef.current,
            rect: cellsRect,
          };
        } else {
          const cells = [
            ...cellsRef.current?.childNodes,
          ].reverse() as HTMLElement[];
          for (const cell of cells) {
            const rect = cell.getBoundingClientRect();
            if (rect.top < 0) {
              pinnedCell.current = {
                el: cell,
                rect,
              };
              return;
            }
          }
        }
      }
    } else if (pinnedCell.current) {
      let offset = 0;
      const newRect = pinnedCell.current.el.getBoundingClientRect();
      if (pinnedCell.current.el === cellsRef.current) {
        offset = newRect.height - pinnedCell.current.rect.height;
      } else {
        offset = newRect.top - pinnedCell.current.rect.top;
      }
      document.documentElement.scrollTop += offset;
      pinnedCell.current = null;
    }
  }, [isRunning]);

  return (
    <div className={styles.category}>
      <div className={styles.preheader}>EdgeQL Tutorial</div>
      <h1>{category.category}</h1>

      {categoryPages.length > 1 ? (
        <>
          <div className={cn(styles.preheader, styles.subtopics)}>
            Subtopics
          </div>
          <TutorialPageNav
            categoryPages={categoryPages}
            page={page}
            title={category.category}
          />
        </>
      ) : null}

      {prev === null ? <div className={styles.introIllustration} /> : null}

      <div className={styles.cells} ref={cellsRef}>
        {page.cells.map((cellId) => (
          <Cell key={cellId} cellId={cellId} pagePath={page.path} />
        ))}
      </div>

      <FooterNav
        prev={
          prev
            ? {
                url: `/tutorial/${prev.path}`,
              }
            : null
        }
        next={
          next
            ? {
                url: `/tutorial/${next.path}`,
                categoryTitle: next.categoryTitle,
              }
            : null
        }
      />
    </div>
  );
}

function Cell({cellId, pagePath}: {cellId: number; pagePath: string}) {
  const cell = useSelector((state: State) => state.cells.get(cellId)!);

  switch (cell.kind) {
    case "edgeql":
      return (
        <CodeCell
          className={styles.codeCell}
          cell={cell}
          pagePath={pagePath}
        />
      );
    case "text":
      return <TextCell content={cell.content} />;
    default:
      assertNever(cell);
  }
}

function assertNever(x: never): never {
  throw new Error(`Unexpected cell kind: ${x}`);
}
