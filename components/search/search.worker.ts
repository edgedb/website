import Index from "@edgedb/site-build-tools/jolr";
import type {RequestMessageData, ResponseMessageData} from "./workerTypes";

const ctx: Worker = self as any;

const sendMessage = (message: ResponseMessageData) => ctx.postMessage(message);

(() => sendMessage({type: "loaded"}))();

const indexes = new Map<string, Promise<Index>>();

function loadIndex(id: string, path: string) {
  if (!indexes.has(id)) {
    const index = fetch(path)
      .then((res) => res.json())
      .then((indexData) =>
        Index.fromJSON(id, indexData.index, {
          index: 5,
          name: 3,
          title: 2,
          type: 0.5,
        })
      );
    indexes.set(id, index);
  }
}

function getIndex(id: string) {
  if (!indexes.has(id)) {
    throw new Error(`No index loaded for "${id}"`);
  }
  return indexes.get(id)!;
}

ctx.onmessage = async (e: {data: RequestMessageData}) => {
  switch (e.data.type) {
    case "preload": {
      for (const {id, path} of e.data.indexes) {
        loadIndex(id, path);
      }

      break;
    }
    case "query": {
      const {id, indexIds, query} = e.data;

      try {
        const results = await Promise.all(
          indexIds.map(async (indexId) =>
            (await getIndex(indexId)).search(query)
          )
        );

        const result = {
          hash: results.map((res) => res.hash).join("_"),
          query: results[0].query,
          results: results
            .flatMap((res) => res.results)
            .sort((a, b) => b.score - a.score),
        };

        sendMessage({type: "query", id, result});
      } catch (err) {
        sendMessage({type: "error", id, error: (err as Error).toString()});
      }

      break;
    }
  }
};
