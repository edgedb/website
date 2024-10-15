"use client";

import { PropsWithChildren, useRef } from "react";
import { observer } from "mobx-react";

import { useBrowserLayoutEffect } from "@edgedb-site/shared/hooks/useBrowserLayoutEffect";

import styles from "../tutorial.module.scss";
import { useTutorialPageState } from "@edgedb-site/shared/tutorial/state";

export const TutorialCellsWrapper = observer(function TutorialCellsWrapper({
  children,
}: PropsWithChildren) {
  const isRunning = useTutorialPageState().queryRunning;

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
    <div className={styles.cells} ref={cellsRef}>
      {children}
    </div>
  );
});
