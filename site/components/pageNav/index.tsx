import {Fragment, useEffect, useState} from "react";

import Link from "next/link";
import {useRouter} from "next/router";

import cn from "@edgedb-site/shared/utils/classNames";

import {useOverlayActive} from "@edgedb-site/shared/hooks/useOverlayActive";
import {mediaQuery} from "@edgedb-site/shared/hooks/mediaQuery";

import metadata from "@/build-cache/metadata.json";

import styles from "./pageNav.module.scss";

import {LogoDesktop, DocsLogoText, LogoMobile} from "./logo";
import {
  BurgerMenuIcon,
  CloseIcon,
  DiscordIcon,
  GitHubIcon,
  TwitterIcon,
} from "@/components/icons";
import {
  NavBlogIcon,
  NavCareersIcon,
  NavCloudIcon,
  NavHomeIcon,
  NavInstallIcon,
  NavPricingIcon,
} from "@/components/icons/nav";
import {
  LearnSmallRocketIcon,
  LearnSmallBookIcon,
  LearnSmallDocsIcon,
  LearnSmallTutorialIcon,
} from "@/components/icons/learn";

interface LinkItem {
  type: "link";
  name: string;
  url: string;
  icon?: JSX.Element;
}
interface MenuItem {
  type: "menu";
  name: string;
  component: JSX.Element;
}
interface LinkGroup {
  type: "linkGroup";
  name: string;
  links: LinkItem[];
}

const navItems: (LinkItem | MenuItem)[] = [
  {type: "link", name: "Cloud", url: "/cloud", icon: <NavCloudIcon />},
  {type: "link", name: "Pricing", url: "/pricing", icon: <NavPricingIcon />},
  {
    type: "link",
    name: "Docs",
    url: "https://docs.edgedb.com",
    icon: <LearnSmallDocsIcon />,
  },
  {type: "link", name: "Blog", url: "/blog", icon: <NavBlogIcon />},
];

const mobileNavItems: (LinkItem | LinkGroup)[] = [
  {type: "link", name: "Careers", url: "/careers", icon: <NavCareersIcon />},
];

function LinkLogo() {
  return (
    <Link href="/" style={{display: "flex"}}>
      <LogoDesktop styles={styles} />
      <LogoMobile styles={styles} />
    </Link>
  );
}

function LinkItem({
  className,
  link,
  activeLink,
}: {
  className?: string;
  link: LinkItem;
  activeLink: boolean;
}) {
  return (
    <li
      className={cn(styles.textLink, className, {
        [styles.activeLink]: activeLink,
      })}
    >
      <Link href={link.url} prefetch={false}>
        {link.icon}
        <span>{link.name}</span>
      </Link>
    </li>
  );
}

export function PageNav() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useOverlayActive("PageNav");

  useEffect(() => {
    if (menuOpen) {
      // Add media query listener to close menu if window is resized from
      // mobile -> desktop width.
      // Fixes an edge case where the window is mobile width, the full-screen
      // menu is opened, then the window is resized to desktop width where the
      // full-screen menu is now visually hidden (by css breakpoint) but the
      // menu is still in the 'open' state, causing the user to be unable to
      // scroll the page.

      return mediaQuery("(max-width: 1024px)", () => setMenuOpen(false));
    }
  }, [menuOpen]);

  const activeLink = navItems.find((item) => {
    if (item.type !== "link") return false;

    if (item.url === "/") return router.asPath === "/";
    return router.asPath.startsWith(item.url);
  });

  return (
    <div
      className={cn(styles.pageNav, {
        [styles.menuOpen]: menuOpen,
      })}
      style={{display: "contents"}}
    >
      <nav>
        <ul className={styles.links}>
          {navItems.map((item, i) => {
            switch (item.type) {
              case "link":
                return (
                  <LinkItem
                    key={i}
                    link={item}
                    activeLink={item === activeLink}
                  />
                );
              case "menu":
                return <Fragment key={i}>{item.component}</Fragment>;
            }
          })}

          {mobileNavItems.map((item, i) => {
            switch (item.type) {
              case "link":
                return (
                  <LinkItem
                    key={`m${i}`}
                    className={styles.mobileLink}
                    link={item}
                    activeLink={item === activeLink}
                  />
                );
              case "linkGroup":
                return (
                  <li className={styles.linkGroup} key={`g${i}`}>
                    <div className={styles.groupName}>{item.name}</div>
                    <ul className={styles.links}>
                      {item.links.map((item, gi) => (
                        <LinkItem
                          key={`g${i}-${gi}`}
                          link={item}
                          activeLink={item === activeLink}
                        />
                      ))}
                    </ul>
                  </li>
                );
            }
          })}

          <li className={styles.iconLinks}>
            <a href="https://twitter.com/edgedatabase">
              <span>
                <TwitterIcon />
              </span>
            </a>

            <a href="https://discord.gg/umUueND6ag">
              <span>
                <DiscordIcon />
              </span>
            </a>

            <a
              className={styles.splitButton}
              href="https://github.com/edgedb/edgedb"
            >
              <span>
                <GitHubIcon />
              </span>
              <span>{(metadata.starCount / 1000).toFixed(1)}k</span>
            </a>
          </li>
        </ul>
      </nav>

      <div
        className={styles.navMenu}
        onClick={() => {
          setMenuOpen(!menuOpen);
        }}
      >
        {menuOpen ? <CloseIcon /> : <BurgerMenuIcon />}
      </div>
    </div>
  );
}

function PromoLink({caption, target}: {caption: string; target: string}) {
  return (
    <a className={cn("promoLink", styles.promoLink)} href={target}>
      <span>{caption}</span>
    </a>
  );
}

function TMinus({
  when,
  caption,
  target,
}: {
  when: number;
  caption: string;
  target: string;
}) {
  const [seconds, setSeconds] = useState(-1);
  const updateSeconds = () =>
    setSeconds(Math.floor((when - new Date().getTime()) / 1000));

  useEffect(() => {
    // update asap
    updateSeconds();

    // schedule the periodic update
    const interval = setInterval(updateSeconds, 1000);

    return () => clearInterval(interval);
  }, []);

  if (seconds < 0) {
    return <PromoLink caption={caption} target={target} />;
  } else {
    // not using locale APIs intentionally, preferring to
    // just format with spaces instead
    const fmt = seconds
      .toString()
      .split("")
      .reverse()
      .join("")
      .replace(/(\d\d\d)/g, "$1\u2009") // 0x2009 - unicode for thin space
      .split("")
      .reverse()
      .join("");
    return <PromoLink caption={`T–${fmt}`} target={target} />;
  }
}

interface PageHeaderProps {
  injectElement?: JSX.Element;
  docsHeader?: boolean;
}

export default function PageHeader({
  injectElement,
  docsHeader,
}: PageHeaderProps) {
  return (
    <div className={docsHeader ? styles.docsHeader : styles.pageHeader}>
      <div className={styles.headerWrapper}>
        <div className={styles.headerLogo}>
          <LinkLogo />
          {docsHeader ? (
            <DocsLogoText className={styles.siteSectionName} />
          ) : null}
        </div>
        <div className={styles.injectedComponent}>{injectElement}</div>
        <div className={styles.content}>
          <PageNav />
        </div>
      </div>
    </div>
  );
}
