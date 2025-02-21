import ThemeSwitcher from "@edgedb-site/shared/components/themeSwitcher";

import { DocsLogo } from "./logo";
import { HeaderNav } from "./nav";

import { HeaderSearchButton } from "@/components/search/buttons";
import { HeaderAskAIButton } from "../gpt/buttons";

import styles from "./pageHeader.module.scss";

const navLinks = [
  { href: "/", label: "Get Started", extraActivePath: "/get-started" },
  { href: "/guides", label: "Guides" },
  { href: "/cloud", label: "Cloud" },
  // { href: "/ui", label: "UI" },
  { href: "/ai", label: "AI" },
  { href: "/cli", label: "CLI" },
  { href: "/libraries", label: "Libraries" },
  { href: "/database", label: "Database" },
  // { href: "/q+a", label: "Q&A" },
  { href: "/changelog", label: "Changelog" },
];

export function PageHeader() {
  return (
    <header className={styles.pageHeader}>
      <DocsLogo />

      <div className={styles.controls}>
        <HeaderSearchButton />
        <HeaderAskAIButton />
      </div>

      <HeaderNav links={navLinks} />

      <ThemeSwitcher className={styles.themeSwitcher} />
    </header>
  );
}
