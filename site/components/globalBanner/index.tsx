import {useContext, useEffect, useState} from "react";

import cn from "@edgedb-site/shared/utils/classNames";

import {
  OverlayContext,
  useOverlayActive,
} from "@edgedb-site/shared/hooks/useOverlayActive";

import {CloseIcon} from "@/components/icons";
import ExpandingArrow from "@edgedb-site/shared/components/expandingArrow";

import {useWindowSize} from "@edgedb-site/shared/hooks/useWindowSize";

import styles from "./globalBanner.module.scss";
import Link from "next/link";

interface GlobalBannerProps {
  tag: string;
  title: string;
  url: string;
}

export default function GlobalBanner(props: GlobalBannerProps) {
  const {activeOverlay} = useContext(OverlayContext);
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(`${props.tag}Dismissed`)) {
      setBannerOpen(true);
    }
  }, []);

  useEffect(() => {
    if (bannerOpen) {
      document.body.style.setProperty("--globalBannerHeight", "48px");
    } else {
      document.body.style.setProperty("--globalBannerHeight", null);
    }
  }, [bannerOpen]);

  return (
    <div
      className={cn(styles.globalBannerContainer, {
        [styles.bannerHidden]: !bannerOpen || activeOverlay?.id === "PageNav",
      })}
    >
      <div className={styles.globalBanner}>
        {/* <div className={styles.bannerMessage}></div> */}
        <Link className={styles.bannerLink} href={props.url}>
          {props.title}
          <ExpandingArrow
            className={styles.expandingArrow}
            strokeWidth={2}
            height={10}
            width={18}
            expandBy={8}
          />
        </Link>
        <div
          className={styles.bannerClose}
          onClick={() => {
            localStorage.setItem(`${props.tag}Dismissed`, "true");
            setBannerOpen(false);
          }}
        >
          <CloseIcon />
        </div>
      </div>
    </div>
  );
}

export function PostEventBanner() {
  const windowSize = useWindowSize();

  return (
    <GlobalBanner
      title={
        windowSize.width && windowSize.width < 700
          ? "EdgeDB 2.0 is here"
          : "EdgeDB 2.0 has landed! | View the announcement"
      }
      tag="edgedbTwoLaunched"
      url="https://www.edgedb.com/blog/edgedb-2-0"
    />
  );
}

export function LiveEventBanner() {
  const windowSize = useWindowSize();

  return (
    <GlobalBanner
      title={
        windowSize.width && windowSize.width < 700
          ? "EdgeDB Developer Day"
          : "EdgeDB Developer Day | Nov 1st | Register now"
      }
      tag="edgedb4.0devday"
      url="/launch"
    />
  );
}

export function CloudBanner() {
  const windowSize = useWindowSize();
  if (!windowSize.width) return null;
  if (windowSize.width > 1024) {
    return null;
  }
  return (
    <GlobalBanner
      title={
        windowSize.width && windowSize.width < 450
          ? "Join the Cloud waitlist"
          : "Join the EdgeDB Cloud waitlist"
      }
      tag="cloudBanner"
      url="https://www.edgedb.com/p/cloud-waitlist"
    />
  );
}
