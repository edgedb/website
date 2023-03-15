import Link from "next/link";

import cn from "@/utils/classNames";

import {
  LearnSmallRocketIcon,
  LearnSmallTutorialIcon,
  LearnSmallBookIcon,
  LearnSmallDocsIcon,
  LearnRfcsIcon,
  LearnYoutubeIcon,
  LearnCheatsheetsIcon,
  LearnBlogIcon,
  LearnRoadmapIcon,
} from "@/components/icons/learn";

import navStyles from "./pageNav.module.scss";
import styles from "./learnMenu.module.scss";

export default function LearnMenu() {
  return (
    <li className={cn(navStyles.textLink, styles.learnMenu)}>
      <div className={styles.menuButton}>
        <span>Learn</span>
      </div>

      <div className={styles.popupPanelWrapper}>
        <div className={styles.popupPanel}>
          <div className={styles.arrow} />
          <div className={styles.primaryLinks}>
            <Link href="/docs">
              <a className={styles.primaryLink}>
                <div className={styles.linkTitle}>
                  <LearnSmallDocsIcon />
                  Documentation
                </div>
                <p>
                  An in-depth look at everything there is to know about EdgeDB:
                  data types, query language, schema and database setup, etc.
                </p>
              </a>
            </Link>
            <Link href="/docs/guides/quickstart">
              <a className={styles.primaryLink}>
                <div className={styles.linkTitle}>
                  <LearnSmallRocketIcon />
                  5-min Quickstart
                </div>
                <p>
                  Install EdgeDB, create a simple schema, and write your first
                  queries in under 5 minutes.
                </p>
              </a>
            </Link>
            <Link href="/tutorial">
              <a className={styles.primaryLink}>
                <div className={styles.linkTitle}>
                  <LearnSmallTutorialIcon />
                  EdgeQL Tutorial
                </div>
                <p>
                  The quickest way to learn the key concepts of EdgeDB without
                  installation, right in your browser.
                </p>
              </a>
            </Link>
            <Link href="/easy-edgedb">
              <a className={styles.primaryLink}>
                <div className={styles.linkTitle}>
                  <LearnSmallBookIcon />
                  Easy EdgeDB Book
                </div>
                <p>
                  An easy to follow book about using EdgeDB for an imaginary
                  game based on the setting in Bram Stoker's 1897 book Dracula.
                </p>
              </a>
            </Link>
          </div>

          <div className={styles.secondaryLinks}>
            {/* <Link href="/roadmap">
              <a className={styles.secondaryLink}>
                <LearnRoadmapIcon />
                Roadmap
              </a>
            </Link> */}
            <Link href="https://github.com/edgedb/rfcs">
              <a className={styles.secondaryLink}>
                <LearnRfcsIcon />
                RFCs
              </a>
            </Link>
            <Link href="/docs/guides/cheatsheet/index">
              <a className={styles.secondaryLink}>
                <LearnCheatsheetsIcon />
                Cheatsheets
              </a>
            </Link>
            <Link href="/blog">
              <a className={styles.secondaryLink}>
                <LearnBlogIcon />
                Blog
              </a>
            </Link>
            <Link href="https://www.youtube.com/c/EdgeDB">
              <a className={styles.secondaryLink}>
                <LearnYoutubeIcon />
                YouTube
              </a>
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
