import { PropsWithChildren } from "react";
import _Link, { LinkProps } from "next/link";

import cn from "@edgedb-site/shared/utils/classNames";

import { TwitterIcon, GitHubIcon, DiscordIcon, YoutubeIcon } from "../icons";
import { SubscribeForm } from "../subscribe";

import styles from "./pageFooter.module.scss";

type SiteHostname = "www.edgedb.com" | "docs.edgedb.com";

export function FooterLinks({
  className,
  hostname,
}: {
  className?: string;
  hostname: SiteHostname;
}) {
  const Link = getLink(hostname);

  return (
    <div className={cn(styles.linksGrid, className)}>
      <div className={styles.linksGroup}>
        <div className={styles.heading}>Product</div>
        <Link href="/">Home</Link>
        <Link href="/cloud">Cloud</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="https://www.edgedbstatus.com/">Cloud Status</Link>
      </div>
      <div className={styles.linksGroup}>
        <div className={styles.heading}>Resources</div>
        <Link href="https://docs.edgedb.com/get-started/quickstart">
          Quickstart
        </Link>
        <Link href="https://docs.edgedb.com">Documentation</Link>
        <Link href="https://docs.edgedb.com/tutorial">Tutorial</Link>
        <Link href="https://docs.edgedb.com/easy-edgedb">Easy EdgeDB</Link>
        <Link href="https://discord.gg/edgedb">Community Discord</Link>
        {/* <Link href="/community">Community</Link> */}
      </div>
      <div className={styles.linksGroup}>
        <div className={styles.heading}>Company</div>
        <Link href="/about">About</Link>
        {/* <Link href="/careers">Careers</Link> */}
        <Link href="/presskit">Press Kit</Link>
        <Link href="/terms-of-use">Terms of Use</Link>
        <Link href="/privacy-policy">Privacy Policy</Link>
        <Link href="/cloud-terms-and-conditions">
          Cloud Terms and Conditions
        </Link>
      </div>
    </div>
  );
}

function getLink(hostname: string) {
  return ({
    href,
    ...props
  }: PropsWithChildren<Omit<LinkProps, "href"> & { href: string }>) => {
    const url = new URL(href, "https://www.edgedb.com");
    return (
      <_Link
        href={url.hostname === hostname ? url.pathname : url.toString()}
        {...props}
      />
    );
  };
}

export interface PageFooterProps {
  hostname: SiteHostname;
  minimal?: boolean;
  className?: string;
  linksClassName?: string;
  theme?: "dark" | "light";
}

export function FooterContent({
  hostname,
  minimal,
  className,
  linksClassName,
}: PageFooterProps) {
  return (
    <div className={className}>
      <div className={styles.footerContent}>
        <FooterLinks hostname={hostname} className={linksClassName} />
        {!minimal ? (
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

            <div className={styles.rssLink}>
              <_Link href="https://www.edgedb.com/rss.xml">RSS</_Link>
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.copyright}>
        <a href="https://twitter.com/edgedatabase">
          <TwitterIcon />
        </a>
        <a href="https://github.com/edgedb">
          <GitHubIcon />
        </a>
        <a href="https://discord.gg/edgedb">
          <DiscordIcon />
        </a>
        <a href="https://youtube.com/@EdgeDB">
          <YoutubeIcon />
        </a>
        <p className={styles.label}>&copy;&nbsp;2024, EdgeDB Inc.</p>
      </div>
    </div>
  );
}

export default function PageFooter({
  className,
  hostname,
}: {
  className?: string;
  hostname: SiteHostname;
}) {
  return (
    <div className={cn(styles.pageFooter, className)}>
      <FooterContent hostname={hostname} />
    </div>
  );
}
