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
  params: { path?: string[] };
};

export default async function ClientLibsPages({ params }: PageProps) {
  const { doc } = await getDocsDocument(["clients", ...(params?.path ?? [])]);

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
        />
      </RightSidebar>
    </>
  );
}

export async function generateStaticParams() {
  const docsPaths = await getDocsPaths("clients");

  return docsPaths
    .filter((paths) => !(paths.length === 1 && paths[0] === ""))
    .map((path) => ({ path }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const title = await getDocTitle(["clients", ...(params?.path ?? [])]);

  return { title: title.slice(0, -1).join(" - ") };
}
