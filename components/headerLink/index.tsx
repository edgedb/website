import cn from "@/utils/classNames";
import {PropsWithChildren} from "react";

import styles from "./headerLink.module.scss";

import {HeaderGithubIcon, HeaderLinkIcon} from "./icons";

export interface HeaderLinkProps extends HeaderLinkInnerProps {
  className?: string;
  level?: number;
  element?: string;
  // children: ReactNode;
}

export default function HeaderLink({
  id,
  className,
  level,
  element,
  githubLink,
  children,
}: PropsWithChildren<HeaderLinkProps>): JSX.Element {
  const Header: any = element ?? `h${level || 1}`;
  let badge: string | undefined;
  if (id.slice(-4) === "-new") {
    id = id.slice(0, -4);
  }
  if (Array.isArray(children) && typeof children[0] === "string") {
    if (level === 1) {
      // don't render badge
      children[0] = children[0].split("#")[0];
    } else {
      badge = (children[0].split("#")[1] || "").trim();
      children[0] = children[0].split("#")[0];
    }
  } else if (level === 1) {
  }

  return (
    <Header id={id} className={cn(styles.header, className)}>
      {children}
      {badge ? <div className={styles.badge}>{badge}</div> : null}
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

export function HeaderLinkInner({id, githubLink}: HeaderLinkInnerProps) {
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
