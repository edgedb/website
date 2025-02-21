"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import cn from "@edgedb-site/shared/utils/classNames";

import type { TutorialTocData } from "@/dataSources/tutorial";

import styles from "./toc.module.scss";

export default function TutorialTOC({ navData }: { navData: TutorialTocData }) {
  const pathname = usePathname();
  const blocks: JSX.Element[] = [];

  const activePath = pathname.split("/").slice(0, 4).join("/");

  let isCompleted = true;
  for (const section of navData) {
    const catBlocks: JSX.Element[] = [];

    for (const category of section.categories) {
      const isActiveCategory = category.href === activePath;
      if (isActiveCategory) {
        isCompleted = false;
      }
      catBlocks.push(
        <li key={category.title}>
          <Link
            href={category.href}
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

            {category.title}
          </Link>
        </li>
      );
    }

    blocks.push(
      <div key={section.title} className={styles.section}>
        <div className={styles.sectionName}>{section.title}</div>

        <ul className={styles.category}>{catBlocks}</ul>
      </div>
    );
  }

  return <div className={styles.toc}>{blocks}</div>;
}
