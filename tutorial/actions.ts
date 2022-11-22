import {createAction, createAsyncThunk} from "@reduxjs/toolkit";

import {Buffer} from "buffer";

import {_ICodec} from "edgedb";

import {InspectorState} from "@edgedb/inspector/v2/state";

import {
  State,
  CellResultsAPIValidator,
  CellResult,
  CodeCellState,
} from "./types";

import type {AppDispatch, GetState} from "./store";
import {getEdgeDBServerURL} from "./srvloc";

import {decode} from "./binproto";
import {queryWrap} from "./utils";

export const updateCodeCell = createAction(
  "updateCodeCell",
  (id: number, code: string) => {
    return {
      payload: {
        id,
        code,
      },
    };
  }
);

export const toggleCodeCellMode = createAction<{cellId: number}>(
  "toggleCodeCellMode"
);

export const resetAllCodeCells = createAction<{
  pagePath: string;
}>("resetAllCodeCells");

let resultId = 0;

export const runCells = createAsyncThunk<
  CellResult[],
  {
    pagePath: string;
    cellId?: number;
  },
  {
    dispatch: AppDispatch;
    getState: GetState;
  }
>("runCells", async ({pagePath, cellId: untilCellId}, {getState}) => {
  const state = getState() as State;
  const pageData = state.pages.get(pagePath)!;

  let cellFound = false;
  const {queries, initialQueries: _initialQueries, modes} = Array.from(
    pageData.cells
  ).reduce<{
    queries: string[];
    initialQueries: string[];
    modes: ("binary" | "json")[];
  }>(
    (queries, cellId) => {
      const cell = state.cells.get(cellId);
      if (cell?.kind === "edgeql" && !cellFound) {
        queries.queries.push(queryWrap(cell.mode, cell.text.trim()));
        queries.initialQueries.push(
          queryWrap(state.defaultMode, cell.initialText)
        );

        queries.modes.push(cell.mode);

        cellFound = cell.id === untilCellId;
      }
      return queries;
    },
    {queries: [], initialQueries: [], modes: []}
  );

  if (!queries.length) {
    return [];
  }

  const queriesRequest = JSON.stringify({
    queries,
  });

  const initialQueries = JSON.stringify({
    queries: _initialQueries,
  });

  let fetchedResults = pageData.prefetchedResults?.slice(0, queries.length);
  let protocolVersion = state.protocolVersion ?? undefined;

  if (queriesRequest !== initialQueries || fetchedResults == null) {
    const response = await fetch(getEdgeDBServerURL(), {
      method: "POST",
      mode: "cors",
      body: queriesRequest,
    });

    protocolVersion = response.headers
      .get("edgedb-protocol-version")
      ?.split(".")
      .map((n) => parseInt(n, 10)) as [number, number];

    const data = CellResultsAPIValidator.parse(await response.json());
    if (data.kind === "error") {
      throw new Error(`${data.error.type}: ${data.error.message}`);
    }

    fetchedResults = data.results;
  }

  const results: CellResult[] = [];

  for (const res of fetchedResults) {
    switch (res.kind) {
      case "data": {
        let [data, codec] = decode(
          res.data[0],
          res.data[1],
          res.data[2],
          protocolVersion
        ) as [any, _ICodec];

        const resState = new InspectorState({});
        resState.initData({data, codec}, modes[results.length] === "json");

        results.push({
          kind: "data",
          id: resultId++,
          state: resState,
          input: res.data,
          status: res.data[3]
            ? Buffer.from(res.data[3], "base64").toString("utf8")
            : "SELECT",
        });
        break;
      }
      case "error":
        results.push({
          kind: "error",
          error: res.error,
          mode: modes[results.length],
        });
        break;

      case "skipped":
        results.push(null);
        break;
    }
  }

  results.push(...Array(queries.length - results.length).fill(null));

  return results;
});
