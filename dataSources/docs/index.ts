import {PromiseType} from "@/utils/typing";

import {DocsDocument} from "dataBuild/interfaces";
import {getSourceData, pick} from "../utils";
import pathAliases from "./pathAliases";
import skipPaths from "./skipPaths";

const getDocsData = () =>
  getSourceData(["docs", "data"]) as Promise<DocsDocument[]>;

export async function getDocsPaths() {
  const docs = await getDocsData();

  const paths = docs
    .filter((doc) => doc.id && !skipPaths.has(doc.id))
    .filter((doc) => {
      if (!doc.title) {
        return false;
      }
      return true;
    })
    .map((doc) => doc.id.split("/"));

  return [[""], ...paths];
}

export async function getDocsDocument(path?: string[]) {
  const docs = await getDocsData();

  let relname = path ? path.join("/") : "";

  if (pathAliases.has(relname)) {
    relname = pathAliases.get(relname)!;
  }

  const doc = docs.find((doc) => {
    return doc.id === relname;
  });

  if (!doc) {
    throw new Error(`No doc found for path '${relname}'`);
  }

  return {
    doc: {...pick(doc, ["document", "headers", "id", "title", "versioning"])},
  };
}

export type DocsDocumentData = PromiseType<ReturnType<typeof getDocsDocument>>;
