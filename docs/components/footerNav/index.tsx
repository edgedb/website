import Link from "next/link";

import cn from "@edgedb-site/shared/utils/classNames";

import {ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon} from "@/components/icons";

import styles from "./footerNav.module.scss";

export interface NavItem {
  url: string;
  title: string;
  label: string;
}

function NavBlock(block: NavItem, kind: "Prev" | "Next") {
  return (
    <>
      <Link href={block.url} className={styles["refIcon" + kind]}>
        {kind === "Next" ? <ArrowRightIcon /> : <ArrowLeftIcon />}
      </Link>
      <span className={styles["refLabel" + kind]}>{block.label}</span>
      <Link href={block.url} className={styles["ref" + kind]}>
        {block.title}
      </Link>
    </>
  );
}

interface FooterNavProps {
  nav: {
    next: NavItem | null;
    prev: NavItem | null;
  };
  className?: string;
  backButton?: {
    title: string;
    url: string;
  };
}

export default function FooterNav({
  nav,
  className,
  backButton,
}: FooterNavProps) {
  const postNav =
    nav.next || nav.prev ? (
      <div className={styles.footerLinks}>
        {nav.prev ? NavBlock(nav.prev, "Prev") : null}
        <div className={styles.footerSplit}></div>
        {nav.next ? NavBlock(nav.next, "Next") : null}
      </div>
    ) : null;

  return (
    <footer className={cn(styles.footerNav, className)}>
      {postNav}

      {backButton ? (
        <div className={styles.footerButtons}>
          <Link href={backButton.url} className={styles.button}>
            <ArrowUpIcon />
            {backButton.title}
          </Link>
        </div>
      ) : null}
    </footer>
  );
}
