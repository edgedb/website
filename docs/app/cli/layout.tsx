import { Metadata } from "next";
import DocsNav from "@/components/docsNav";
import { Layout, LeftSidebar } from "@/components/layout";
import { getDocsNavData } from "@/dataSources/docs/nav";

export const metadata: Metadata = {
  title: {
    template: "%s | CLI | EdgeDB Docs",
    default: "CLI",
  },
};

export default async function CliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navData = await getDocsNavData("/", "cli", false, "cli");

  return (
    <Layout>
      <LeftSidebar>
        <DocsNav navData={navData} header="CLI" />
      </LeftSidebar>
      {children}
    </Layout>
  );
}
