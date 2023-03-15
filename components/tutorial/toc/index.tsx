import {createContext, PropsWithChildren, useContext, useEffect} from "react";
import {useSelector} from "react-redux";

import Link from "next/link";

import cn from "@/utils/classNames";
import {useOverlayActive} from "hooks/useOverlayActive";
import {mediaQuery} from "hooks/mediaQuery";

import ThemeSwitcher from "@/components/docs/themeSwitcher";

import {State} from "tutorial/types";

import {CloseIcon} from "@/components/icons";

import styles from "./toc.module.scss";

export const TutorialTocContext = createContext({
  menuOpen: false,
  setMenuOpen: (open: boolean) => {},
});

export function useTutorialTocContext() {
  return useContext(TutorialTocContext);
}

export function TutorialTocProvider({children}: PropsWithChildren<{}>) {
  const [menuOpen, setMenuOpen] = useOverlayActive("TutorialToc");
  return (
    <TutorialTocContext.Provider value={{menuOpen, setMenuOpen}}>
      {children}
    </TutorialTocContext.Provider>
  );
}

interface TOCProps {
  activeSection: string;
  activeCategory: string;
}

export default function TutorialTOC({
  activeSection,
  activeCategory,
}: TOCProps) {
  const sections = useSelector((state: State) => state.sections);

  const {menuOpen, setMenuOpen} = useTutorialTocContext();

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

  const blocks: JSX.Element[] = [];

  let isCompleted = true;
  for (const secSlug of sections.keys()) {
    const sec = sections.get(secSlug)!;
    const catBlocks: JSX.Element[] = [];
    const isActiveSection = activeSection === secSlug;

    for (const catSlug of sec.categories.keys()) {
      const cat = sec.categories.get(catSlug)!;
      const isActiveCategory = isActiveSection && activeCategory === catSlug;
      if (isActiveCategory) {
        isCompleted = false;
      }
      catBlocks.push(
        <li
          key={cat.slug}
          className={cn(styles.categoryLink, {
            [styles.completed]: isCompleted,
            [styles.active]: isActiveCategory,
          })}
        >
          <svg
            viewBox="0 0 18 18"
            preserveAspectRatio="none"
            className={styles.line}
          >
            <path d="M 9 0 v 0 18" />
          </svg>
          <svg viewBox="0 0 18 18">
            <circle className={styles.ring} cx="9" cy="9" r="7" />
            <circle className={styles.dot} cx="9" cy="9" r="4" />
          </svg>

          <Link href={`/tutorial/${sec.slug}/${cat.slug}`}>
            <a>{cat.category}</a>
          </Link>
        </li>
      );
    }

    blocks.push(
      <div key={sec.slug} className={styles.section}>
        <div className={styles.sectionName}>{sec.title}</div>

        <ul className={styles.category}>{catBlocks}</ul>
      </div>
    );
  }

  return (
    <div
      className={cn(styles.toc, {
        [styles.menuOpen]: menuOpen,
      })}
    >
      <div className={styles.inner}>{blocks}</div>
      <div className={styles.menuClose} onClick={() => setMenuOpen(false)}>
        <CloseIcon />
      </div>
      <ThemeSwitcher />
    </div>
  );
}
