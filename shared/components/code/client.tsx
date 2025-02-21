"use client";

import { useState, useRef } from "react";

import cn from "@edgedb-site/shared/utils/classNames";
import { CodeExpandIcon, CopiedIcon, CopyIcon } from "../icons";

import styles from "./code.module.scss";

export function CollapsingCodeBlock({
  className,
  children,
  ...otherProps
}: React.PropsWithChildren<
  { className: string; style?: React.CSSProperties } & { [key: string]: any }
>) {
  const [collapsed, setCollapsed] = useState(true);

  const codeRef = useRef<HTMLDivElement>(null);

  const onCollapse = () => {
    setCollapsed(!collapsed);

    if (!collapsed) {
      const el = codeRef.current;
      if (el) {
        let top = el.offsetTop;
        let pel = el;
        while (pel.offsetParent) {
          pel = pel.offsetParent as HTMLDivElement;
          top += pel.offsetTop;
        }

        if (top < window.pageYOffset) {
          el.scrollIntoView();
        }
      }
    }
  };

  return (
    <div
      className={cn(className, {
        [styles.collapsed]: collapsed,
        [styles.expanded]: !collapsed,
      })}
      ref={codeRef}
      {...otherProps}
    >
      {children}
      <div className={styles.showMore} onClick={onCollapse}>
        {collapsed ? "Show more" : "Show less"}
        <CodeExpandIcon />
      </div>
    </div>
  );
}

interface CopyCodeProps {
  code: string;
  className?: string;
}

export function CopyCode({ code, className }: CopyCodeProps) {
  const [showMessage, setShowMessage] = useState(false);
  const timeout = useRef<NodeJS.Timeout>();

  return (
    <div
      className={cn(styles.copyCode, className)}
      onClick={() => {
        navigator.clipboard?.writeText(code);
        if (timeout.current) {
          clearTimeout(timeout.current);
        }
        setShowMessage(true);
        timeout.current = setTimeout(() => setShowMessage(false), 2000);
      }}
    >
      {!showMessage ? (
        <>
          <CopyIcon />
          <span className={styles.copyLabel}>Copy</span>
        </>
      ) : (
        <>
          <CopiedIcon className={styles.copiedIcon} />
          <span className={styles.copiedLabel}>Copied!</span>
        </>
      )}
    </div>
  );
}
