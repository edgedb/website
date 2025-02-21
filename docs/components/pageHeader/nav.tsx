"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import cn from "@edgedb-site/shared/utils/classNames";

import styles from "./pageHeader.module.scss";
import { CustomScrollbars } from "@edgedb/common/ui/customScrollbar";

export function HeaderNav({
  links,
}: {
  links: { href: string; label: string; extraActivePath?: string }[];
}) {
  const pathname = usePathname() + "/";

  return (
    <CustomScrollbars
      className={styles.customScrollbars}
      innerClass={styles.headerNavLinks}
    >
      <nav className={styles.headerNav}>
        <div className={cn(styles.scrollNavContent, styles.headerNavLinks)}>
          {links.map(({ href, label, extraActivePath }) => {
            const isActive =
              pathname.startsWith(href + "/") ||
              (extraActivePath && pathname.startsWith(extraActivePath + "/"));

            return (
              <Link
                key={href}
                href={href}
                className={isActive ? styles.active : undefined}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </CustomScrollbars>
  );
}
