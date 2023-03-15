import {Fragment, useEffect} from "react";

import Link from "next/link";
import {useRouter} from "next/router";

import cn from "@/utils/classNames";

import {useOverlayActive} from "hooks/useOverlayActive";
import {mediaQuery} from "hooks/mediaQuery";

import LearnMenu from "./learnMenu";

import metadata from "@/build-cache/metadata.json";

import styles from "./pageNav.module.scss";

import Logo, {DocsLogoText} from "./logo";
import {
  BurgerMenuIcon,
  CloseIcon,
  DiscordIcon,
  GitHubIcon,
  TwitterIcon,
} from "@/components/icons";
import {
  NavAboutIcon,
  NavBlogIcon,
  NavCareersIcon,
  NavCommunityIcon,
  NavHomeIcon,
  NavInstallIcon,
  NavPresskitIcon,
  NavRoadmapIcon,
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
  {type: "link", name: "Home", url: "/", icon: <NavHomeIcon />},
  {type: "link", name: "Install", url: "/install", icon: <NavInstallIcon />},
  {type: "menu", name: "Learn", component: <LearnMenu />},
  {type: "link", name: "Blog", url: "/blog", icon: <NavBlogIcon />},
];

const mobileNavItems: (LinkItem | LinkGroup)[] = [
  {
    type: "link",
    name: "Community",
    url: "/community",
    icon: <NavCommunityIcon />,
  },
  {
    type: "linkGroup",
    name: "Learn",
    links: [
      {
        type: "link",
        name: "5-min Quickstart",
        url: "/docs/guides/quickstart",
        icon: <LearnSmallRocketIcon />,
      },
      {
        type: "link",
        name: "Easy EdgeDB Book",
        url: "/easy-edgedb",
        icon: <LearnSmallBookIcon />,
      },
      {
        type: "link",
        name: "EdgeQL Tutorial",
        url: "/tutorial",
        icon: <LearnSmallTutorialIcon />,
      },
      {
        type: "link",
        name: "Documentation",
        url: "/docs",
        icon: <LearnSmallDocsIcon />,
      },
    ],
  },
  // {type: "link", name: "Roadmap", url: "/roadmap", icon: <NavRoadmapIcon />},
  {type: "link", name: "Careers", url: "/careers", icon: <NavCareersIcon />},
];

function LinkLogo() {
  return (
    <Link href="/">
      <a style={{display: "flex"}}>
        <Logo styles={styles} />
      </a>
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
        <a>
          {link.icon}
          <span>{link.name}</span>
        </a>
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

      <a className={cn(styles.promoLink)} href="/p/cloud-waitlist">
        <span>Join Cloud Waitlist</span>
      </a>

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
      <div className="globalPageWrapper">
        <div className={styles.headerLogo}>
          <LinkLogo />
          {docsHeader ? (
            <DocsLogoText className={styles.siteSectionName} />
          ) : null}
        </div>
        <div className={styles.content}>
          <div className={styles.injectedComponent}>{injectElement}</div>
          <PageNav />
        </div>
      </div>
    </div>
  );
}
