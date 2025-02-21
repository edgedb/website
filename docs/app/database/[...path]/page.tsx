import { Metadata } from "next";
import { Main, RightSidebar } from "@/components/layout";
import {
  docsReactComponents,
  docsRenderComponents,
} from "@/components/xmlRenderer/docsComponents";
import { getDocsPaths, getDocsDocument, getDocTitle } from "@/dataSources/docs";

import { renderDocument } from "@edgedb-site/shared/xmlRenderer";
import docsStyles from "@/app/docs.module.scss";

import { DocsToC } from "@/components/docsToc";

export const dynamic = "force-static";
export const dynamicParams = false;

type PageProps = {
  params: { path: string[] };
};

export default async function DatabasePages({ params }: PageProps) {
  const { doc } = await getDocsDocument(params.path);

  return (
    <>
      <Main>
        {renderDocument(
          doc.document,
          docsStyles,
          docsRenderComponents,
          docsReactComponents
        )}
      </Main>
      <RightSidebar>
        <DocsToC
          headers={doc.headers}
          sectionSelector={`.${docsStyles.section}`}
          anchorVersions={doc.versioning.anchors}
          pageVer={doc.versioning.page}
        />
      </RightSidebar>
    </>
  );
}

export async function generateStaticParams() {
  const [datamodelPaths, edgeqlPaths, stdlibPaths, referencePaths, cheatsheetPaths] =
    await Promise.all([
      getDocsPaths("datamodel"),
      getDocsPaths("edgeql"),
      getDocsPaths("stdlib"),
      getDocsPaths("reference"),
      getDocsPaths("cheatsheets"),
    ]);

  return [
    ...datamodelPaths.map((path) => ({ path: ["datamodel", ...path] })),
    ...edgeqlPaths.map((path) => ({ path: ["edgeql", ...path] })),
    ...stdlibPaths.map((path) => ({ path: ["stdlib", ...path] })),
    ...referencePaths.map((path) => ({ path: ["reference", ...path] })),
    ...cheatsheetPaths.map((path) => ({ path: ["cheatsheets", ...path] }))
  ];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const title = await getDocTitle(params?.path ?? []);

  return { title: title.join(" - ") };
}
