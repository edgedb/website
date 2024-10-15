import { Metadata } from "next";
import DocsNav from "@/components/docsNav";
import { Layout, LeftSidebar } from "@/components/layout";
import { getDocsNavData } from "@/dataSources/docs/nav";

export const metadata: Metadata = {
  title: {
    template: "%s | Guides | EdgeDB Docs",
    default: "Guides",
  },
};

export default async function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navData = await getDocsNavData("/", "guides", false, "guides");

  return (
    <Layout>
      <LeftSidebar>
        <DocsNav navData={navData} header="Guides" />
      </LeftSidebar>
      {children}
    </Layout>
  );
}
