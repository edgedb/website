"use client";

import Link from "next/link";

import styles from "./qnaNav.module.scss";

export function QnANav({ tags }: { tags: { name: string; count: number }[] }) {
  return (
    <div className={styles.qnaNav}>
      <Link href="/q+a">Overview</Link>
      {tags.map((tag) => (
        <Link key={tag.name} href={`/q+a/tags/${tag.name}`}>
          <span>{tag.name}</span>
          <span className={styles.count}>{tag.count}</span>
        </Link>
      ))}
    </div>
  );
}
