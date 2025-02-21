import { PromiseType } from "@edgedb-site/shared/utils/typing";

import { DocsDocument } from "@/dataBuild/interfaces";
import { getSourceData, pick } from "../utils";
import pathAliases from "./pathAliases";
import skipPaths from "./skipPaths";
import { DocsNavItem } from "./interfaces";

const getDocsData = () =>
  getSourceData(["docs", "data"]) as Promise<DocsDocument[]>;

export async function getDocsPaths(section: string) {
  const docs = await getDocsData();

  const paths = docs
    .filter((doc) => doc.id && doc.title && !skipPaths.has(doc.id))
    .map((doc) => doc.id.replace(/\/index$/, "/").split("/"))
    .filter((pathParts) => pathParts[0] === section)
    .map((pathParts) => pathParts.slice(1));

  return paths;
}

export async function getDocsDocument(path?: string[]) {
  const docs = await getDocsData();

  let relname = path ? path.join("/") : "";

  if (pathAliases.has(relname)) {
    relname = pathAliases.get(relname)!;
  }

  const doc = docs.find((doc) => {
    return doc.id.replace(/\/index$/, "") === relname;
  });

  if (!doc) {
    throw new Error(`No doc found for path '${relname}'`);
  }

  return {
    doc: { ...pick(doc, ["document", "headers", "id", "title", "versioning"]) },
  };
}

export type DocsDocumentData = PromiseType<ReturnType<typeof getDocsDocument>>;

export async function getDocTitle(path: string[], fallbackPageTitle?: string) {
  const data = (await getSourceData(["docs", "nav"])) as DocsNavItem[];

  const title: string[] = [];

  let items = data;
  for (let i = 1; i <= path.length; i++) {
    const uri = path.slice(0, i).join("/");
    const item = items.find(
      (item) => item.uri?.replace(/\/index$/, "") === uri
    )!;
    if (item) {
      title.push(item.title);
      if (i < path.length) {
        items = item.children ?? [];
      }
    } else if (fallbackPageTitle && i === path.length) {
      title.push(fallbackPageTitle);
    }
  }

  return title.reverse();
}
