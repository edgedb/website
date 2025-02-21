import { Metadata } from "next";
import DocsNav from "@/components/docsNav";
import { Layout, LeftSidebar } from "@/components/layout";
import { getDocsNavData } from "@/dataSources/docs/nav";

export const metadata: Metadata = {
  title: {
    template: "%s | Cloud | EdgeDB Docs",
    default: "Cloud",
  },
};

export default async function CloudLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navData = await getDocsNavData("/", "cloud", false, "cloud");

  return (
    <Layout>
      <LeftSidebar>
        <DocsNav navData={navData} header="Cloud" />
      </LeftSidebar>
      {children}
    </Layout>
  );
}
