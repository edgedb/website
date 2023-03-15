import cn from "@/utils/classNames";
import {PropsWithChildren} from "react";
import {useDocVersion} from "../docs/docVersionContext";

import styles from "./headerLink.module.scss";

import {HeaderGithubIcon, HeaderLinkIcon} from "./icons";

export interface HeaderLinkProps extends HeaderLinkInnerProps {
  className?: string;
  level?: number;
  element?: string;
  versionAdded?: string;
}

export default function HeaderLink({
  id,
  className,
  level,
  element,
  githubLink,
  versionAdded,
  children,
}: PropsWithChildren<HeaderLinkProps>): JSX.Element {
  const version = versionAdded ? useDocVersion().version : null;

  const Header: any = element ?? `h${level || 1}`;

  return (
    <Header id={id} className={cn(styles.header, className)}>
      {children}
      {version && version <= versionAdded! ? (
        <div
          className={cn(styles.badge, {
            [styles.warning]: version != versionAdded,
          })}
        >
          {version == versionAdded ? "New" : `Added in v${versionAdded}`}
        </div>
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
