import {useEffect, useState, useRef} from "react";
import {useRouter} from "next/router";
import Link from "next/link";

import {useOverlayActive} from "@edgedb-site/shared/hooks/useOverlayActive";
import {
  HackerNewsIcon,
  TwitterIcon,
} from "@edgedb-site/shared/components/icons";
import cn from "@edgedb-site/shared/utils/classNames";
import {SubscribePopup} from "@/components/subscribe";
import {ArrowUpIcon, BlogEmailIcon} from "@/components/icons";
import styles from "./shareAndSubscribe.module.scss";

interface BlogToCProps {
  postTitle: string;
}

export default function ShareAndSubscribe({postTitle}: BlogToCProps) {
  const [visible, setVisible] = useState(true);
  const [subscribePopupOpen, setSubscribePopupOpen] =
    useOverlayActive("BlogToCSubscribe");

  const ref = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    if (ref.current) {
      const observer = new ResizeObserver((entries) => {
        setVisible(
          entries[0].target.clientHeight >= entries[0].target.scrollHeight
        );
      });

      observer.observe(ref.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [ref]);

  const twitHref =
    "https://twitter.com/intent/tweet?text=" +
    encodeURIComponent(
      `${postTitle} edgedb.com${router.asPath.split("#")[0]} @edgedatabase`
    );

  const hnHref =
    "https://news.ycombinator.com/submitlink?u=" +
    encodeURIComponent(`https://edgedb.com${router.asPath.split("#")[0]}`) +
    "&t=" +
    encodeURIComponent(postTitle);

  return (
    <>
      <div
        className={cn(styles.container, {
          [styles.hide]: !visible,
        })}
        ref={ref}
      >
        <Link href="/blog" className={styles.iconLink}>
          <ArrowUpIcon />
          <span>All posts</span>
        </Link>

        <a href={twitHref} className={styles.iconLink} target="_blank">
          <TwitterIcon />
          <span>Tweet</span>
        </a>
        <a href={hnHref} className={styles.iconLink} target="_blank">
          <HackerNewsIcon />
          <span>Share</span>
        </a>
        <div
          className={styles.iconLink}
          onClick={() => setSubscribePopupOpen(true)}
        >
          <BlogEmailIcon />
          <span>Subscribe</span>
        </div>
      </div>
      {subscribePopupOpen && (
        <SubscribePopup onClose={() => setSubscribePopupOpen(false)} />
      )}
    </>
  );
}
