import type {IndexSearchReturn} from "@edgedb/site-build-tools/jolr";

export type RequestMessageData =
  | {
      type: "preload";
      indexes: {id: string; path: string}[];
    }
  | {
      type: "query";
      id: number;
      indexIds: string[];
      query: string;
    };

export type ResponseMessageData =
  | {
      type: "loaded";
    }
  | {
      type: "query";
      id: number;
      result: IndexSearchReturn;
    }
  | {
      type: "error";
      id: number;
      error: string;
    };
