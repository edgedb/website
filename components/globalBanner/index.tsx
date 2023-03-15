import {useContext, useEffect, useState} from "react";

import cn from "@/utils/classNames";

import {OverlayContext, useOverlayActive} from "hooks/useOverlayActive";
import {mediaQuery} from "hooks/mediaQuery";

import {CloseIcon} from "@/components/icons";
import ExpandingArrow from "@/components/expandingArrow";

import {useWindowSize} from "hooks/useWindowSize";

import styles from "./globalBanner.module.scss";

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
      return mediaQuery(
        "(max-width: 768px)",
        (mq) => {
          document.body.style.setProperty(
            "--globalBannerHeight",
            mq.matches ? "48px" : null
          );
          // setMobileOverlayActive(!!mq.matches);
        },
        true
      );
    } else {
      document.body.style.setProperty("--globalBannerHeight", null);
      // if (mobileOverlayActive) {
      //   setMobileOverlayActive(false);
      // }
    }
  }, [bannerOpen /*, mobileOverlayActive*/]);

  return (
    <div
      className={cn(styles.globalBannerContainer, {
        [styles.bannerHidden]: !bannerOpen || activeOverlay?.id === "PageNav",
      })}
    >
      <div className={styles.globalBanner}>
        {/* <div className={styles.bannerMessage}></div> */}
        <a className={styles.bannerLink} href={props.url}>
          {props.title}
          <ExpandingArrow
            className={styles.expandingArrow}
            strokeWidth={2}
            height={10}
            width={18}
            expandBy={8}
          />
        </a>
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
          ? "EdgeDB 2.0 is coming"
          : "EdgeDB 2.0 Launch Livestream | July 28th | Register now"
      }
      tag="edgedbTwoLaunch"
      url="https://lu.ma/edgedb"
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
