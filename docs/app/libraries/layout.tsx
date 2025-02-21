import { Metadata } from "next";
import DocsNav from "@/components/docsNav";
import { Layout, LeftSidebar } from "@/components/layout";
import { getDocsNavData } from "@/dataSources/docs/nav";

export const metadata: Metadata = {
  title: {
    template: "%s | Libraries | EdgeDB Docs",
    default: "Libraries",
  },
};

export default async function ClientLibsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navData = await getDocsNavData(
    "/libraries",
    "libraries",
    true,
    "clients"
  );

  return (
    <Layout>
      <LeftSidebar>
        <DocsNav navData={navData} header="Libraries" />
      </LeftSidebar>
      {children}
    </Layout>
  );
}
