"use client";

import cn from "@edgedb-site/shared/utils/classNames";
import { PropsWithChildren } from "react";
import { HeaderGithubIcon, HeaderLinkIcon } from "./icons";
import styles from "./headerLink.module.scss";

export interface HeaderLinkProps extends HeaderLinkInnerProps {
  className?: string;
  level?: number;
  element?: string;
  badge?: string;
  badgeClass?: string;
}

export default function HeaderLink({
  id,
  className,
  level,
  element,
  githubLink,
  badge,
  badgeClass,
  children,
}: PropsWithChildren<HeaderLinkProps>): JSX.Element {
  const Header: any = element ?? `h${level || 1}`;

  return (
    <Header id={id} className={cn(styles.header, className)}>
      {children}
      {badge ? (
        <span className={cn(styles.badge, badgeClass)}>{badge}</span>
      ) : null}
      <span className={styles.popupWrapper}>
        &#8203;
        <div className={styles.linkPopup}>
          <div className={styles.popupBg} />
          <HeaderLinkInner id={id} githubLink={githubLink} />
        </div>
      </span>
    </Header>
  );
}

interface HeaderLinkInnerProps {
  id: string;
  githubLink?: string;
}

export function HeaderLinkInner({ id, githubLink }: HeaderLinkInnerProps) {
  return (
    <div className={styles.linksInner} onClick={(e) => e.stopPropagation()}>
      <a href={`#${id}`}>
        <HeaderLinkIcon />
      </a>
      {githubLink ? (
        <>
          <div className={styles.spacer} />
          <a href={githubLink}>
            <HeaderGithubIcon />
          </a>
        </>
      ) : null}
    </div>
  );
}
