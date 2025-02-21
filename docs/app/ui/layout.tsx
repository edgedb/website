import DocsNav from "@/components/docsNav";
import { Layout, LeftSidebar } from "@/components/layout";
import { getDocsNavData } from "@/dataSources/docs/nav";

export default async function UILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navData = await getDocsNavData("/", "ui", false, "ui");

  return (
    <Layout>
      <LeftSidebar>
        <DocsNav navData={navData} header="UI" />
      </LeftSidebar>
      {children}
    </Layout>
  );
}
