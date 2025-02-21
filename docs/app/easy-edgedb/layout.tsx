import { Layout, LeftSidebar } from "@/components/layout";

import EasyEDBToC from "@/components/easyedb/toc";

export default async function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <LeftSidebar>
        <EasyEDBToC />
      </LeftSidebar>
      {children}
    </Layout>
  );
}
