import { Layout, LeftSidebar } from "@/components/layout";

import { getTags } from "../_api";

import { SideNav } from "@/components/layout/sideNav";
import { QnANav } from "@/components/qna/nav";

export default async function QandALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <LeftSidebar>
        <SideNav header="Q&A">
          <QnANav tags={await getTags()} />
        </SideNav>
      </LeftSidebar>
      {children}
    </Layout>
  );
}
