import {PropsWithChildren, useRef, useState} from "react";

import cn from "@/utils/classNames";

import {useBrowserLayoutEffect} from "hooks/useBrowserLayoutEffect";

import {
  PageBackgroundColourProps,
  useHtmlClass,
  usePageBackgroundColour,
} from "./_base";

import styles from "./layout.module.scss";

import PageHeader from "@/components/pageNav";
import {FooterContent} from "@/components/pageFooter";
import {CloudBanner} from "@/components/globalBanner";

interface DocsLayoutProps extends PageBackgroundColourProps {
  className?: string;
  nav: JSX.Element;
  sidebar?: JSX.Element;
  headerInjectComponent?: JSX.Element;
}

export default function DocsLayout(props: PropsWithChildren<DocsLayoutProps>) {
  const pageBgStyles = usePageBackgroundColour(props);

  useHtmlClass(cn(styles.docsLayoutRoot, props.htmlClassName));

  return (
    <>
      <div
        className={cn(styles.docsLayout, props.className)}
        style={pageBgStyles}
      >
        {/* <CloudBanner /> */}

        <PageHeader docsHeader injectElement={props.headerInjectComponent} />

        <div className="globalPageWrapper">
          <div className={styles.docsNav}>{props.nav}</div>
          <div className={styles.docsContent}>
            {props.children}
            <div className={styles.docsFooterWrapper}>
              <FooterContent className={styles.docsFooter} />
            </div>
          </div>
          <div className={styles.docsSidebar}>
            <StickySidebar>{props.sidebar}</StickySidebar>
          </div>
        </div>
      </div>
    </>
  );
}

function StickySidebar({children}: PropsWithChildren<{}>) {
  const ref = useRef<HTMLDivElement>(null);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  useBrowserLayoutEffect(() => {
    if (ref.current) {
      const observer = new ResizeObserver(() => {
        setSidebarHidden(
          ref.current!.clientHeight < ref.current!.scrollHeight
        );
      });

      observer.observe(ref.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [ref, children]);

  return (
    <div
      ref={ref}
      className={styles.docsSidebarSticky}
      style={{visibility: sidebarHidden ? "hidden" : undefined}}
    >
      {children}
    </div>
  );
}
