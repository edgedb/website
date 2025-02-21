import { Metadata } from "next";
import DocsNav from "@/components/docsNav";
import { Layout, LeftSidebar } from "@/components/layout";
import { getDocsNavData } from "@/dataSources/docs/nav";
import { DocVersionProvider } from "@/hooks/docVersion";

export const metadata: Metadata = {
  title: {
    template: "%s | Database | EdgeDB Docs",
    default: "Database",
  },
};

export default async function DatabaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navData = await getDocsNavData(
    "/database",
    "/",
    false,
    "datamodel",
    "edgeql",
    "stdlib",
    "reference",
    "cheatsheets"
  );

  return (
    <DocVersionProvider>
      <Layout>
        <LeftSidebar>
          <DocsNav navData={navData} header="Database" showVersionSwitcher />
        </LeftSidebar>
        {children}
      </Layout>
    </DocVersionProvider>
  );
}
