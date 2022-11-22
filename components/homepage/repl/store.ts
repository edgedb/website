import {createStore, applyMiddleware} from "redux";
import thunk from "redux-thunk";

import {State} from "tutorial/types";
import {getReducer} from "tutorial/reducers";

import {enableMapSet} from "immer";
enableMapSet();

import data from "@/build-cache/homepage/replData.json";

const initialState: State = {
  cells: new Map(
    data.queries.map((text, i) => [
      i,
      {
        id: i,
        kind: "edgeql",
        mode: "json",
        text,
        initialText: text,
        result: null,
        resultOutdated: false,
        errorInCell: null,
      },
    ])
  ),
  pages: new Map([
    [
      "homepage",
      {
        path: "homepage",
        title: "",
        slug: "",
        cells: data.queries.map((_, i) => i),
        prefetchedResults: data.prefetchedResults as any,
      },
    ],
  ]),
  sections: new Map(),
  running: false,
  exception: null,
  protocolVersion: data.protocolVersion as any,
  defaultMode: "json",
};

const reducer = getReducer(initialState);

const store = createStore(reducer, applyMiddleware(thunk));

export default store;
