import {IndexSearchReturn} from "@edgedb-site/build-tools/jolr";
import type {RequestMessageData, ResponseMessageData} from "./workerTypes";

let searchWorker: Worker | null = null;
let workerLoadingFailed = false;
let resolvePendingQuery:
  | ((value: IndexSearchReturn | null) => void)
  | null = null;
let rejectPendingQuery: ((error: any) => void) | null = null;
let workerQueryId = 0;

function getSearchWorker() {
  return new Promise<Worker>(async (resolve, reject) => {
    if (!searchWorker) {
      searchWorker = new Worker(new URL("./search.worker", import.meta.url));

      searchWorker.addEventListener("error", (err) => {
        workerLoadingFailed = true;
        reject(err);
      });

      searchWorker.addEventListener(
        "message",
        ({data}: {data: ResponseMessageData}) => {
          switch (data.type) {
            case "loaded":
              resolve(searchWorker!);
              break;
            case "query":
              if (data.id === workerQueryId && resolvePendingQuery) {
                resolvePendingQuery(data.result);
                resolvePendingQuery = null;
                rejectPendingQuery = null;
              }
              break;
            case "error":
              if (data.id === workerQueryId && rejectPendingQuery) {
                rejectPendingQuery(data.error);
                resolvePendingQuery = null;
                rejectPendingQuery = null;
              }
          }
        }
      );
    } else if (workerLoadingFailed) {
      reject();
    } else {
      resolve(searchWorker);
    }
  });
}

async function _search(
  query: string,
  indexIds: string[]
): Promise<IndexSearchReturn | null> {
  const searchWorker = await getSearchWorker();

  return new Promise((resolve, reject) => {
    if (resolvePendingQuery) {
      resolvePendingQuery(null);
    }

    searchWorker.postMessage({
      type: "query",
      id: workerQueryId++ + 1,
      indexIds,
      query,
    } as RequestMessageData);
    resolvePendingQuery = resolve;
    rejectPendingQuery = reject;
  });
}

let timeout: NodeJS.Timeout;
let pendingResolve: any;
export function search(
  query: string,
  indexIds: string[]
): Promise<IndexSearchReturn | null> {
  if (timeout) {
    clearTimeout(timeout);
    pendingResolve(null);
  }
  return new Promise((resolve) => {
    pendingResolve = resolve;
    timeout = setTimeout(() => _search(query, indexIds).then(resolve), 100);
  });
}

export async function preloadIndexes(indexes: {id: string; path: string}[]) {
  const searchWorker = await getSearchWorker();

  searchWorker.postMessage({
    type: "preload",
    indexes,
  } as RequestMessageData);
}
