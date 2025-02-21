"use client";

import {
  PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { usePathname } from "next/navigation";

import cn from "@edgedb-site/shared/utils/classNames";

import { useBreakpoint } from "@edgedb-site/shared/hooks/useBreakpoint";
import { useBoundingRect } from "@edgedb-site/shared/hooks/useBoundingRect";

import { CustomScrollbars } from "@edgedb/common/ui/customScrollbar";

import styles from "./sideNav.module.scss";
import { useOverlayActive } from "@edgedb-site/shared/hooks/useOverlayActive";
import { CloseIcon } from "../search/icons";

export function SideNav({
  header,
  className,
  contentClassName,
  children,
  hideMenuButton,
  alwaysOverlay,
}: PropsWithChildren<{
  header?: string | JSX.Element;
  className?: string;
  contentClassName?: string;
  hideMenuButton?:
    | boolean
    | ("xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "max")[];
  alwaysOverlay?: boolean;
}>) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen, openMenuId] = useOverlayActive("SideNav");

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(40);
  useBoundingRect(headerRef, ({ height }) => setHeaderHeight(height));

  const breakpoint = useBreakpoint();

  const overlayMenu =
    alwaysOverlay ||
    breakpoint === "xs" ||
    breakpoint === "sm" ||
    breakpoint === "md";

  const scrollIgnoreLength = {
    xs: 0,
    sm: 0,
    md: 0,
    lg: 32,
    xl: 64,
    xxl: 116,
    max: 116,
  };

  const bottomScrollBarOffset =
    breakpoint === "xs" || breakpoint === "sm" ? 16 : 40;

  useLayoutEffect(() => {
    if (openMenuId === "SideNav") {
      setMenuOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    return () => setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (openMenuId === "SideNav" && !overlayMenu) {
      setMenuOpen(false);
    }
  }, [overlayMenu, openMenuId]);

  return (
    <div
      className={cn(styles.sideNavWrapper, {
        [styles.menuOpen]: menuOpen,
      })}
    >
      <nav
        className={cn(styles.sideNav, className, {
          [styles.alwaysOverlay]: !!alwaysOverlay,
        })}
      >
        <CustomScrollbars
          className={styles.customScrollbars}
          verticalBarClass={styles.verticalBar}
          innerClass={styles.scrollContent}
          verScrollBarBottomOffset={bottomScrollBarOffset}
          verScrollIgnoreLength={scrollIgnoreLength[breakpoint]}
          headerPadding={
            header
              ? (overlayMenu
                  ? 16
                  : breakpoint === "lg"
                  ? 60
                  : breakpoint === "xl"
                  ? 92
                  : 144) + headerHeight
              : 16
          }
        >
          <div className={styles.scrollContainer}>
            <div className={cn(styles.scrollContent, contentClassName)}>
              {header ? (
                <div className={styles.header}>
                  <div ref={headerRef} className={styles.headerInner}>
                    {header}
                  </div>
                </div>
              ) : null}

              {children}
            </div>
          </div>
        </CustomScrollbars>
      </nav>

      <div className={styles.overlay} onClick={() => setMenuOpen(false)} />

      {overlayMenu ? (
        <div
          className={cn(styles.toggleMenuButton, {
            [styles.closeOnly]:
              hideMenuButton === true ||
              (Array.isArray(hideMenuButton) &&
                hideMenuButton.includes(breakpoint)),
          })}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className={styles.inner}>
            <MenuIcon />
          </div>
          <div className={styles.inner}>
            <CloseIcon />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.5 20C17.6716 20 17 20.6716 17 21.5C17 22.3284 17.6716 23 18.5 23C19.3284 23 20 22.3284 20 21.5C20 20.6716 19.3284 20 18.5 20ZM18.5 27C17.6716 27 17 27.6716 17 28.5C17 29.3284 17.6716 30 18.5 30C19.3284 30 20 29.3284 20 28.5C20 27.6716 19.3284 27 18.5 27ZM18.5 34C19.3284 34 20 34.6716 20 35.5C20 36.3284 19.3284 37 18.5 37C17.6716 37 17 36.3284 17 35.5C17 34.6716 17.6716 34 18.5 34ZM23.5 20C22.6716 20 22 20.6716 22 21.5C22 22.3284 22.6716 23 23.5 23H36.5C37.3284 23 38 22.3284 38 21.5C38 20.6716 37.3284 20 36.5 20H23.5ZM23.5 27C22.6716 27 22 27.6716 22 28.5C22 29.3284 22.6716 30 23.5 30H36.5C37.3284 30 38 29.3284 38 28.5C38 27.6716 37.3284 27 36.5 27H23.5ZM36.5 34C37.3284 34 38 34.6716 38 35.5C38 36.3284 37.3284 37 36.5 37H23.5C22.6716 37 22 36.3284 22 35.5C22 34.6716 22.6716 34 23.5 34H36.5Z"
      />
    </svg>
  );
}
