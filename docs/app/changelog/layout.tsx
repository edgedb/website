import DocsNav from "@/components/docsNav";
import { Layout, LeftSidebar } from "@/components/layout";
import { getDocsNavData } from "@/dataSources/docs/nav";

export default async function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navData = await getDocsNavData("/", "changelog", false, "changelog");

  return (
    <Layout>
      <LeftSidebar>
        <DocsNav navData={navData} header="Changelog" />
      </LeftSidebar>
      {children}
    </Layout>
  );
}
