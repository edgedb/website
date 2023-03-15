import Link from "next/link";

import cn from "@/utils/classNames";

import {TwitterIcon, GitHubIcon, DiscordIcon} from "@/components/icons";
import {SubscribeForm} from "@/components/subscribe";

import styles from "./pageFooter.module.scss";

export function FooterLinks({className}: {className?: string}) {
  return (
    <div className={cn(styles.linksGrid, className)}>
      <div className={styles.linksGroup}>
        <div className={styles.heading}>Product</div>
        <Link href="/">
          <a>Home</a>
        </Link>
        <Link href="/install">
          <a>Install</a>
        </Link>
        {/* <Link href="/roadmap">
          <a>Roadmap</a>
        </Link> */}
      </div>
      <div className={styles.linksGroup}>
        <div className={styles.heading}>Resources</div>
        <Link href="/docs/guides/quickstart">
          <a>Quickstart</a>
        </Link>
        <Link href="/docs">
          <a>Documentation</a>
        </Link>
        <Link href="/tutorial">
          <a>Tutorial</a>
        </Link>
        <Link href="/easy-edgedb">
          <a>Easy EdgeDB</a>
        </Link>
        <Link href="/community">
          <a>Community</a>
        </Link>
      </div>
      <div className={styles.linksGroup}>
        <div className={styles.heading}>Company</div>
        <Link href="/about">
          <a>About</a>
        </Link>
        <Link href="/careers">
          <a>Careers</a>
        </Link>
        <Link href="/presskit">
          <a>Press Kit</a>
        </Link>
      </div>
    </div>
  );
}

interface PageFooterProps {
  minimal?: boolean;
  className?: string;
}

export function FooterContent({minimal, className}: PageFooterProps) {
  return (
    <>
      {!minimal ? (
        <div className={cn(styles.footerContent, className)}>
          <FooterLinks />
          <div className={styles.subscribe}>
            <div className={styles.heading}>Newsletter</div>

            <div className={styles.subscribeInput}>
              <SubscribeForm
                styles={styles}
                inputPlaceholder="Enter your email"
              />
            </div>
            <div className={styles.message}>
              Subscribe to our mailing list to be the first to know about new
              blog posts and announcements.
            </div>

            <div className={styles.linksGroup}>
              <Link href="https://www.edgedb.com/rss.xml">RSS</Link>
            </div>
          </div>
        </div>
      ) : null}
      <div className={styles.copyright}>
        <a href="https://twitter.com/edgedatabase">
          <TwitterIcon />
        </a>
        <a href="https://github.com/edgedb">
          <GitHubIcon />
        </a>
        <a href="https://discord.gg/umUueND6ag">
          <DiscordIcon />
        </a>
        <br />
        &copy;&nbsp;2022, EdgeDB Inc.
      </div>
    </>
  );
}

export default function PageFooter({className, minimal}: PageFooterProps) {
  return (
    <footer
      className={cn(styles.pageFooter, className, {
        [styles.minimal]: !!minimal,
      })}
    >
      <div className="globalPageWrapper">
        <FooterContent minimal={minimal} />
      </div>
    </footer>
  );
}
