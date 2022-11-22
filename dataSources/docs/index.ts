import versionsConfig from "../../docVersions.config";

import {PromiseType} from "@/utils/typing";

import {DocsDocument} from "dataBuild/interfaces";
import {getSourceData, pick} from "../utils";
import pathAliases from "./pathAliases";
import skipPaths from "./skipPaths";

const docVersionIds = versionsConfig.versions.map((version) => version.id);

const getDocsData = (versionId: string) =>
  getSourceData(["docs", versionId, "data"]) as Promise<DocsDocument[]>;

export async function getDocsPaths() {
  const paths: string[][] = [];

  const versionIds: string[] = [""];
  let versionsDocs: DocsDocument[][];

  try {
    versionsDocs = [await getDocsData("dev")];
  } catch {
    versionIds.push(...docVersionIds);
    versionsDocs = await Promise.all(
      docVersionIds.map((id) => getDocsData(id))
    );
    versionsDocs = [versionsDocs[0], ...versionsDocs];
  }

  for (let i = 0; i < versionsDocs.length; i++) {
    const versionSlug = versionIds[i];
    const docs = versionsDocs[i];

    paths.push(
      ...docs
        .filter((doc) => doc.id && !skipPaths.has(doc.id))
        .filter((doc) => {
          if (!doc.title) {
            return false;
          }
          return true;
        })
        .map((doc) => {
          const docsPath = doc.id.split("/");
          return versionSlug ? [versionSlug, ...docsPath] : docsPath;
        })
    );
  }

  return [...versionIds.map((versionId) => [versionId]), ...paths];
}

export async function getDocsDocument(path?: string[]) {
  let [docVersion, docPath] = docVersionIds.includes(path?.[0] ?? "")
    ? [path![0], path!.slice(1)]
    : [versionsConfig.versions[0].id, path ?? [""]];

  let docs: DocsDocument[];
  try {
    docs = await getDocsData(docVersion);
  } catch {
    docs = await getDocsData("dev");
    docVersion = "dev";
  }

  let relname = docPath.join("/");

  if (pathAliases.has(relname)) {
    relname = pathAliases.get(relname)!;
  }

  const doc = docs.find((doc) => {
    return doc.id === relname;
  });

  if (!doc) {
    throw new Error(`No doc found for path '${docVersion}/${relname}'`);
  }

  return {
    version: docVersion,
    doc: {...pick(doc, ["document", "headers", "id", "title"])},
  };
}

export async function getLatestDocVersion() {
  let docVersion = docVersionIds[0];

  try {
    await getDocsData(docVersion);
  } catch {
    docVersion = "dev";
  }

  return docVersion;
}

export type DocsDocumentData = PromiseType<ReturnType<typeof getDocsDocument>>;
