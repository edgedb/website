"use client";

import { PropsWithChildren, createContext, useContext, useState } from "react";
import {
  Model,
  _async,
  _await,
  model,
  modelAction,
  modelFlow,
  prop,
} from "mobx-keystone";
import { observable, computed } from "mobx";

import { _ICodec } from "edgedb";
import { decodeB64, utf8Decoder } from "edgedb/dist/primitives/buffer";
import { InspectorState } from "@edgedb/inspector/state";

import {
  CellResult,
  CellResultsAPIValidator,
  CodeCellData,
  EvaledResultData,
} from "./types";
import { queryWrap } from "./utils";
import { getEdgeDBServerURL } from "./srvloc";
import { decode } from "./binproto";

type QueryMode = "binary" | "json";
type ProtoVer = [number, number];

@model("tutorial/store")
export class TutorialStore extends Model({}) {
  pageStateCache = new Map<string, TutorialPageState>();

  createPageState(
    pageId: string,
    prefetchedData: EvaledResultData[],
    codeCells: CodeCellData[],
    protocolVersion: ProtoVer | null,
    defaultMode?: QueryMode
  ) {
    let pageState = this.pageStateCache.get(pageId);
    if (!pageState) {
      pageState = new TutorialPageState({
        prefetchedResults: prefetchedData,
        cells: codeCells.map(
          (cell, i) =>
            new TutorialCellState({
              id: i,
              initialQuery: cell.text.trim(),
              query: cell.text.trim(),
              mode: defaultMode,
            })
        ),
        protocolVersion,
        defaultMode,
      });
      this.pageStateCache.set(pageId, pageState);
    }
    return pageState;
  }
}

let resultId = 0;

@model("tutorial/pageState")
export class TutorialPageState extends Model({
  cells: prop<TutorialCellState[]>(),
  prefetchedResults: prop<EvaledResultData[] | null>(null),
  defaultMode: prop<QueryMode>("binary"),
  protocolVersion: prop<ProtoVer | null>(null),
}) {
  @observable
  queryRunning = false;

  @observable
  exception: string | null = null;

  @observable
  cellResults: (CellResult | null)[] | null = null;

  getCellState(cellId: number) {
    const result =
      this.cellResults?.length ?? 0 > cellId
        ? this.cellResults![cellId]
        : undefined;
    const lastResIndex =
      result === null
        ? this.cellResults!.length -
          [...this.cellResults!].reverse().findIndex((res) => res !== null) -
          1
        : undefined;
    return {
      cell: this.cells[cellId],
      result: result ?? null,
      errorInCell:
        lastResIndex && this.cellResults![lastResIndex]!.kind === "error"
          ? lastResIndex
          : null,
    };
  }

  @computed
  get canResetAll() {
    return this.cells.some((cell) => cell.isEdited);
  }

  @modelAction
  resetAll() {
    for (const cell of this.cells) {
      cell.resetQuery();
    }
  }

  @modelFlow
  run = _async(function* (
    this: TutorialPageState,
    untilCell?: TutorialCellState
  ) {
    if (this.queryRunning) return;

    this.exception = null;
    this.queryRunning = true;

    try {
      this.cellResults = yield* _await(this._runQueries(untilCell));
      for (const cell of this.cells) {
        cell.resultOutdated = false;
      }
    } catch (err) {
      this.exception = err instanceof Error ? err.message : String(err);
    } finally {
      this.queryRunning = false;
    }
  });

  private async _runQueries(untilCell?: TutorialCellState) {
    const queries: string[] = [];
    const initialQueries: string[] = [];
    const modes: QueryMode[] = [];

    for (const cell of this.cells) {
      queries.push(queryWrap(cell.mode, cell.query.trim()));
      initialQueries.push(queryWrap(this.defaultMode, cell.initialQuery));
      modes.push(cell.mode);

      if (cell === untilCell) break;
    }

    if (!queries.length) return [];

    const queriesRequest = JSON.stringify({ queries });
    const initialQueriesRequest = JSON.stringify({ queries: initialQueries });

    let fetchedResults = this.prefetchedResults?.slice(0, queries.length);
    let protocolVersion = this.protocolVersion ?? undefined;

    if (!fetchedResults || queriesRequest !== initialQueriesRequest) {
      const response = await fetch(getEdgeDBServerURL(), {
        method: "POST",
        mode: "cors",
        body: queriesRequest,
      });

      protocolVersion = response.headers
        .get("edgedb-protocol-version")
        ?.split(".")
        .map((n) => parseInt(n, 10)) as ProtoVer;

      const data = CellResultsAPIValidator.parse(await response.json());
      if (data.kind === "error") {
        throw new Error(`${data.error.type}: ${data.error.message}`);
      }

      fetchedResults = data.results;
    }

    const results: (CellResult | null)[] = [];

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
          resState.initData({ data, codec }, modes[results.length] === "json");

          results.push({
            kind: "data",
            id: resultId++,
            state: resState,
            input: res.data,
            status: res.data[3]
              ? utf8Decoder.decode(decodeB64(res.data[3]))
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
  }
}

@model("tutorial/cellState")
export class TutorialCellState extends Model({
  id: prop<number>(),
  mode: prop<QueryMode>("binary").withSetter(),
  query: prop<string>(),
  initialQuery: prop<string>(),
}) {
  @observable
  resultOutdated = false;

  @computed
  get isEdited() {
    return this.query !== this.initialQuery;
  }

  @modelAction
  setQuery(query: string) {
    this.query = query;
    this.resultOutdated = true;
  }

  @modelAction
  resetQuery() {
    this.query = this.initialQuery;
    this.resultOutdated = true;
  }
}

const TutorialStateStoreContext = createContext<TutorialStore>(null!);

const TutorialPageStateContext = createContext<TutorialPageState>(null!);

export function TutorialStateStoreProvider({ children }: PropsWithChildren) {
  const [state] = useState(() => new TutorialStore({}));

  return (
    <TutorialStateStoreContext.Provider value={state}>
      {children}
    </TutorialStateStoreContext.Provider>
  );
}

export function TutorialPageStateProvider({
  pageId,
  prefetchedData,
  codeCells,
  protocolVersion,
  defaultMode,
  children,
}: PropsWithChildren<{
  pageId: string;
  prefetchedData: EvaledResultData[];
  codeCells: CodeCellData[];
  protocolVersion: ProtoVer | null;
  defaultMode?: QueryMode;
}>) {
  const store = useContext(TutorialStateStoreContext);

  const pageState = store.createPageState(
    pageId,
    prefetchedData,
    codeCells,
    protocolVersion,
    defaultMode
  );

  return (
    <TutorialPageStateContext.Provider value={pageState}>
      {children}
    </TutorialPageStateContext.Provider>
  );
}

export function useTutorialPageState() {
  return useContext(TutorialPageStateContext);
}
