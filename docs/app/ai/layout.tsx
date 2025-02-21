import DocsNav from "@/components/docsNav";
import { Layout, LeftSidebar } from "@/components/layout";
import { getDocsNavData } from "@/dataSources/docs/nav";

export default async function AILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navData = await getDocsNavData("/", "ai", false, "ai");

  return (
    <Layout>
      <LeftSidebar>
        <DocsNav navData={navData} header="AI" />
      </LeftSidebar>
      {children}
    </Layout>
  );
}
