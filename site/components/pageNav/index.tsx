import {Fragment, useEffect, useState, type PropsWithChildren} from "react";

import Link from "next/link";
import {useRouter} from "next/router";

import cn from "@edgedb-site/shared/utils/classNames";
import metadata from "@/build-cache/metadata.json";

import {useOverlayActive} from "@edgedb-site/shared/hooks/useOverlayActive";
import {mediaQuery} from "@edgedb-site/shared/hooks/mediaQuery";

import styles from "./pageNav.module.scss";

import {Logo, NavCloud} from "./logo";
import {
  BurgerMenuIcon,
  CloseIcon,
  DiscordIcon,
  GitHubIcon,
} from "@/components/icons";
import {
  NavHomeIcon,
  NavBlogIcon,
  NavCloudIcon,
  NavPricingIcon,
  NavUpdatesIcon,
} from "@/components/icons/nav";
import {LearnSmallDocsIcon} from "@/components/icons/learn";

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
  {type: "link", name: "Home", url: "/", icon: <NavHomeIcon />},
  {type: "link", name: "Cloud", url: "/cloud", icon: <NavCloudIcon />},
  {type: "link", name: "Pricing", url: "/pricing", icon: <NavPricingIcon />},
  {
    type: "link",
    name: "Docs",
    url: "https://docs.edgedb.com",
    icon: <LearnSmallDocsIcon />,
  },
  {type: "link", name: "Blog", url: "/blog", icon: <NavBlogIcon />},
  {
    type: "link",
    name: "Updates",
    url: "/updates",
    icon: <NavUpdatesIcon />,
  },
];

function LinkLogo() {
  return (
    <Link href="/" style={{display: "flex"}}>
      <Logo />
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

function GithubStars({className}: {className?: string}) {
  const githubStars = (metadata.starCount / 1000).toFixed(1) + "k";

  return (
    <div className={cn(styles.githubStars, className)}>
      <Link href="https://github.com/edgedb/edgedb">
        <GitHubIcon />
        <span>{githubStars}</span>
      </Link>
    </div>
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

      return mediaQuery("(max-width: 768px)", () => setMenuOpen(false));
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
          <GithubStars />
          <Link href="https://discord.gg/edgedb" className={styles.discord}>
            <DiscordIcon />
          </Link>
          <Link
            href={process.env.NEXT_PUBLIC_CLOUD_URL!}
            className={styles.mobLoginLink}
          >
            <NavCloud />
            Cloud Login
          </Link>
        </ul>
      </nav>

      <div
        className={cn(styles.navMenu, {[styles.menuOpen]: menuOpen})}
        onClick={() => {
          setMenuOpen(!menuOpen);
        }}
      >
        {menuOpen ? <CloseIcon /> : <BurgerMenuIcon />}
      </div>
    </div>
  );
}

export function PageHeaderSpacer({children}: PropsWithChildren) {
  // This is needed to counter-balance the real header on top of the page
  // to align items strictly at the page center
  return (
    <div className={styles.pageHeaderSpacer}>
      <span></span>
      {children}
    </div>
  );
}

export default function PageHeader() {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.headerWrapper}>
        <div className={styles.headerLogo}>
          <LinkLogo />
        </div>
        <div className={styles.mobileNavSocials}>
          <GithubStars className={styles.hideOnDesktop} />
          <Link
            href="https://discord.gg/edgedb"
            className={cn(styles.discord, styles.hideOnDesktop)}
          >
            <DiscordIcon />
          </Link>
        </div>
        <div className={styles.content}>
          <PageNav />
        </div>
        <Link
          href={process.env.NEXT_PUBLIC_CLOUD_URL!}
          className={styles.loginLink}
        >
          <NavCloud />
          Login
        </Link>
      </div>
    </div>
  );
}
