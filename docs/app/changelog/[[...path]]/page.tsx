import { Main, RightSidebar } from "@/components/layout";
import {
  docsReactComponents,
  docsRenderComponents,
} from "@/components/xmlRenderer/docsComponents";
import { getDocsPaths, getDocsDocument, getDocTitle } from "@/dataSources/docs";

import { renderDocument } from "@edgedb-site/shared/xmlRenderer";
import docsStyles from "@/app/docs.module.scss";

import { DocsToC } from "@/components/docsToc";
import { Metadata } from "next";

export const dynamic = "force-static";
export const dynamicParams = false;

type PageProps = {
  params: { path?: string[] };
};

export default async function ChangelogPages({ params }: PageProps) {
  const { doc } = await getDocsDocument(["changelog", ...(params?.path ?? [])]);

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
  const docsPaths = await getDocsPaths("changelog");

  return docsPaths.map((path) => ({ path }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const title = await getDocTitle(
    ["changelog", ...(params?.path ?? [])],
    (
      await getDocsDocument(["changelog", ...(params?.path ?? [])])
    ).doc.title
  );

  return {
    title:
      title.length > 1
        ? `${title.slice(0, -1).join(" - ")} | Changelog`
        : "Changelog",
  };
}
