import { Metadata } from "next";
import DocsNav from "@/components/docsNav";
import { Layout, LeftSidebar } from "@/components/layout";
import { getDocsNavData } from "@/dataSources/docs/nav";

export const metadata: Metadata = {
  title: {
    template: "%s | Get Started | EdgeDB Docs",
    default: "Get Started",
  },
};

export default async function GetStartedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navData = await getDocsNavData("/get-started", "/../", true, "intro");

  return (
    <Layout>
      <LeftSidebar>
        <DocsNav navData={navData} header="Get Started" />
      </LeftSidebar>
      {children}
    </Layout>
  );
}
