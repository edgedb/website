import {useEffect, useRef, useState} from "react";

import cn from "@/utils/classNames";

import ToC from "@/components/toc";

import styles from "./easyedbSectionNav.module.scss";

interface EasyEDBSectionNavProps {
  headers: {
    id: string;
    title: string;
  }[];
  sectionSelector: string;
}

export default function EasyEDBSectionNav({
  headers,
  sectionSelector,
}: EasyEDBSectionNavProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hideNav, setHideNav] = useState(true);
  const navRef = useRef<HTMLDivElement>(null);
  const scrollIntersectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollIntersectorRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          setScrollProgress(1 - entry.intersectionRatio);
        },
        {
          threshold: Array(101)
            .fill(0)
            .map((_, i) => i / 100),
        }
      );

      observer.observe(scrollIntersectorRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [scrollIntersectorRef]);

  useEffect(() => {
    if (navRef.current) {
      // @ts-ignore
      const observer = new ResizeObserver((entries) => {
        setHideNav(
          entries[0].target.clientHeight < entries[0].target.scrollHeight
        );
      });

      observer.observe(navRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [navRef]);

  return (
    <div
      ref={navRef}
      className={cn(styles.sectionNavWrapper, {
        [styles.hideNav]: hideNav,
      })}
      style={{"--scrollProgress": scrollProgress} as any}
    >
      <div ref={scrollIntersectorRef} className={styles.scrollIntersector} />
      <div className={styles.paddingBlockTop} />
      <ToC headers={headers} sectionSelector={sectionSelector} />
      <div className={styles.paddingBlockBottom} />
    </div>
  );
}
