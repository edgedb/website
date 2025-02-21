import {useEffect, useState} from "react";
import {GetStaticProps} from "next";
import Link from "next/link";

import {
  getInstallInstructionsData,
  InstallInstructionsData,
} from "dataSources/install";

import MainLayout from "@/components/layouts/main";
import Terminal from "@/components/terminal";
import {ControlledTabs} from "@/components/install/tabs";
import InstallInstructions from "@/components/install/installInstructions";

import styles from "@/styles/install.module.scss";
import MetaTags from "@/components/metatags";
import LearnCards from "@/components/learnCards";

type PageProps = {installInstructions: InstallInstructionsData};

export default function InstallPage({installInstructions}: PageProps) {
  return (
    <MainLayout className={styles.page} footerClassName={styles.footer}>
      <MetaTags
        title="Installation"
        description={`Install the latest version of EdgeDB with a single
        command on any system.`}
        relPath="/install"
      />
      <div className="globalPageWrapper">
        <div className={styles.content}>
          <h1 className={styles.title}>Install</h1>

          <div className={styles.intro}>
            <p>
              To install the <code>edgedb</code> CLI, run the appropriate
              command in your terminal and follow the on-screen prompts.
            </p>
          </div>

          <InstallTabs />

          <ul className={styles.tickList}>
            <li>
              This command, inspired by <code>rustup</code>, detects your OS
              and downloads the appropriate build of the EdgeDB's{" "}
              <a href="https://github.com/edgedb/edgedb-cli/">open-source</a>{" "}
              command line tool, <code>edgedb</code>.
            </li>
            <li>
              Once installed, the <code>edgedb</code> CLI can be used to
              install EdgeDB, spin up instances, create and apply migrations,
              and more.
            </li>
            <li>
              You can uninstall EdgeDB server or remove the <code>edgedb</code>{" "}
              command at any time.
            </li>
          </ul>

          <InstallInstructions data={installInstructions} />

          {/* <div className={styles.tutorial}>
            <p>
              Try our online interactive tutorial without installing EdgeDB.
            </p>
            <Link href="/tutorial">
              <a className={styles.tutorialLink}>Start the tutorial</a>
            </Link>
          </div> */}
        </div>
      </div>
    </MainLayout>
  );
}

function InstallTabs() {
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (navigator.userAgent.includes("Windows")) {
      setSelectedTab(1);
    }
  }, []);

  return (
    <ControlledTabs
      tabs={[
        {
          name: "Linux, macOS",
          content: (
            <Terminal
              className={styles.terminal}
              code="curl --proto '=https' --tlsv1.2 -sSf https://sh.edgedb.com | sh"
            />
          ),
        },
        {
          name: "Windows",
          content: (
            <Terminal
              className={styles.terminal}
              code="iwr https://ps1.edgedb.com -useb | iex"
              header="windows"
              lang="powershell"
              prompt="PS>"
            />
          ),
        },
      ]}
      selectedTab={selectedTab}
      onTabSelected={setSelectedTab}
    />
  );
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  return {
    props: {installInstructions: await getInstallInstructionsData()},
  };
};
