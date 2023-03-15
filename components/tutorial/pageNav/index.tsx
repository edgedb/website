import {useEffect, useRef, useState} from "react";
import Link from "next/link";

import cn from "@/utils/classNames";

import {PageState} from "tutorial/types";

import styles from "./pageNav.module.scss";
import {useBoundingRect} from "hooks/useBoundingRect";

interface TutorialPageNavProps {
  categoryPages: PageState[];
  page: PageState;
  title: string;
}

export default function TutorialPageNav({
  categoryPages,
  page,
  title,
}: TutorialPageNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const stickyTitleRef = useRef<HTMLDivElement>(null);

  const [sticky, setSticky] = useState(false);
  const [navHeight, setNavHeight] = useState(60);
  const [stickyTitleWidth, setStickyTitleWidth] = useState(0);

  useBoundingRect(navRef, ({height}) => setNavHeight(height));

  useBoundingRect(stickyTitleRef, ({width}) => setStickyTitleWidth(width));

  useEffect(() => {
    if (sentinelRef.current) {
      const observer = new IntersectionObserver((entries) => {
        setSticky(!entries[0].isIntersecting);
      });

      observer.observe(sentinelRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [sentinelRef]);

  const pageNav: JSX.Element[] = [];
  if (categoryPages.length > 1) {
    for (const p of categoryPages) {
      if (p.slug === page.slug) {
        pageNav.push(
          <span className={styles.activeNav} key={p.slug}>
            {p.title}
          </span>
        );
      } else {
        pageNav.push(
          <Link href={`/tutorial/${p.path}`} key={p.slug}>
            <a>{p.title}</a>
          </Link>
        );
      }
    }
  }

  return (
    <>
      <div
        className={cn(styles.stickyHeader, {
          [styles.sticky]: sticky,
        })}
        style={
          {
            "--navHeight": navHeight + "px",
          } as any
        }
      >
        <div className="globalPageWrapper" style={{height: "100%"}}>
          <div className={styles.header}>
            <div className={styles.heading} ref={stickyTitleRef}>
              <div className={styles.preheader}>EdgeQL Tutorial</div>
              <div className={styles.pageTitle}>{title}</div>
            </div>
          </div>
        </div>
      </div>

      <div ref={sentinelRef} />
      <nav
        className={cn(styles.pageNav, {
          [styles.sticky]: sticky,
        })}
        style={
          {
            "--stickyTitleWidth": stickyTitleWidth + "px",
          } as any
        }
        ref={navRef}
      >
        {pageNav}
      </nav>
      <div className={styles.spacer} />
    </>
  );
}
