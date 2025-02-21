import MainLayout from "@/components/layouts/main";
import MetaTags from "@/components/metatags";
import cn from "@edgedb/common/utils/classNames";
import Env from "@/components/cloud/env";
import { DiscordIcon } from "@/components/icons";
import { TwitterIcon, GitHubIcon, ArrowRightIcon } from "@/components/icons/about";

import styles from "@/styles/links.module.scss";

const LinksPage = () => {
  return (
    <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
      <MetaTags title="Useful Links" description={``} relPath="/links" />
      <Env />
      <h1>Useful links</h1>
      <div className={styles.links}>
        <a className={styles.link} href="https://github.com/edgedb/edgedb">
          <GitHubIcon /><span>Check out the GitHub project</span>
        </a>
        <a className={styles.link} href="https://discord.gg/edgedb">
          <DiscordIcon /><span>Join our Discord to get help</span>
        </a>
        <a className={styles.link} href="https://x.com/edgedatabase">
          <TwitterIcon /><span>Follow us on X</span>
        </a>
      </div>
    </MainLayout>
  );
};

export default LinksPage;
