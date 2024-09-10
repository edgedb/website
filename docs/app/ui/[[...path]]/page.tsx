import { renderDocument } from "@edgedb-site/shared/xmlRenderer";
import { getDocsPaths, getDocsDocument } from "@/dataSources/docs";
import {
  docsReactComponents,
  docsRenderComponents,
} from "@/components/xmlRenderer/docsComponents";
import { Main, RightSidebar } from "@/components/layout";
import { DocsToC } from "@/components/docsToc";
import docsStyles from "@/app/docs.module.scss";

export const dynamic = "force-static";
export const dynamicParams = false;

export default async function UIPages({
  params,
}: {
  params: { path?: string[] };
}) {
  const { doc } = await getDocsDocument(["ui", ...(params?.path ?? [])]);

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
  const docsPaths = await getDocsPaths("ui");

  return docsPaths.map((path) => ({ path }));
}
