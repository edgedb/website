import {createReducer} from "@reduxjs/toolkit";

import immer from "immer";

import * as actions from "./actions";
import {State} from "./types";

export function getReducer(initialState: State) {
  return createReducer(initialState, (builder) => {
    builder.addCase(actions.updateCodeCell, (state, action) => {
      const {id, code} = action.payload;

      return immer(state, (draft) => {
        const cell = draft.cells.get(id);

        if (!cell) {
          throw new Error(`could not find cell with id "${id}"`);
        }
        if (cell.kind !== "edgeql") {
          throw new Error(`cannot update code of cell of kind "${cell.kind}"`);
        }

        cell.text = code;
        cell.resultOutdated = true;
      });
    });

    builder.addCase(actions.toggleCodeCellMode, (state, action) => {
      const {cellId} = action.payload;

      return immer(state, (draft) => {
        const cell = draft.cells.get(cellId);

        if (!cell) {
          throw new Error(`could not find cell with id "${cellId}"`);
        }
        if (cell.kind !== "edgeql") {
          throw new Error(`cannot update code of cell of kind "${cell.kind}"`);
        }

        cell.mode = cell.mode === "binary" ? "json" : "binary";
      });
    });

    builder.addCase(actions.resetAllCodeCells, (state, action) => {
      const {pagePath} = action.payload;

      return immer(state, (draft) => {
        const pageState = draft.pages.get(pagePath);

        if (!pageState) {
          throw new Error(`Could not find page: ${pagePath}`);
        }

        for (const cellId of pageState.cells) {
          const cell = draft.cells.get(cellId);
          if (cell?.kind === "edgeql") {
            cell.text = cell.initialText;
            cell.resultOutdated = true;
          }
        }
      });
    });

    builder.addCase(actions.runCells.pending, (state, action) => {
      if (state.exception != null || !state.running) {
        return immer(state, (draft) => {
          draft.exception = null;
          draft.running = true;
        });
      }
      return state;
    });

    builder.addCase(actions.runCells.fulfilled, (state, {meta, payload}) => {
      const {pagePath} = meta.arg;
      return immer(state, (draft) => {
        draft.running = false;

        const cellIds = draft.pages.get(pagePath)!.cells;

        let i = 0;
        let errorInCell: {id: number; num: number} | null = null;
        for (const cellId of cellIds) {
          const cell = draft.cells.get(cellId)!;
          if (cell.kind === "text") {
            continue;
          }
          if (i < payload.length) {
            const result = payload[i++];
            if (result !== null) {
              cell.result = result;
              cell.errorInCell = null;
              if (result.kind === "error") {
                errorInCell = {id: cellId, num: i};
              }
            } else {
              cell.result = null;
              cell.errorInCell = errorInCell;
            }
          } else {
            cell.result = null;
            cell.errorInCell = null;
          }
          cell.resultOutdated = false;
        }
      });
    });

    builder.addCase(actions.runCells.rejected, (state, action) => {
      // tslint:disable-next-line
      console.error(action.error.message, action.error.stack);

      return immer(state, (draft) => {
        state.running = false;
        state.exception = action.error.message || null;
      });
    });
  });
}
