import { Layout, LeftSidebar } from "@/components/layout";

import TutorialTOC from "@/components/tutorial/toc";
import { getTutorialTocData } from "@/dataSources/tutorial";

import { TutorialStateStoreProvider } from "@edgedb-site/shared/tutorial/state";

import Schema, { SchemaViewProvider } from "@/components/tutorial/schema";
import { SideNav } from "@/components/layout/sideNav";

import styles from "./tutorial.module.scss";

export default async function TutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout mobileControlsClassName={styles.mobileControls}>
      <LeftSidebar>
        <SideNav header="EdgeQL Tutorial" hideMenuButton>
          <TutorialTOC navData={await getTutorialTocData()} />
        </SideNav>
      </LeftSidebar>
      <SchemaViewProvider>
        <TutorialStateStoreProvider>
          {children}
          <Schema />
        </TutorialStateStoreProvider>
      </SchemaViewProvider>
    </Layout>
  );
}
