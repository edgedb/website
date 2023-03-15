import {useEffect, useState, useRef} from "react";
import Link from "next/link";
import {useRouter} from "next/router";

import cn from "@/utils/classNames";

import {useOverlayActive} from "hooks/useOverlayActive";

import ToC from "@/components/toc";
import {Header} from "@/components/xmlRenderer";
import {DiscArrowUpIcon, TwitterIcon, BlogEmailIcon} from "@/components/icons";
import {SubscribePopup} from "@/components/subscribe";

import styles from "./toc.module.scss";
import baseStyles from "@/components/xmlRenderer/base.module.scss";
import blogStyles from "@/styles/blogPost.module.scss";

interface BlogToCProps {
  headers: Header[];
  postTitle: string;
}

export default function BlogToC({headers, postTitle}: BlogToCProps) {
  const trackedHeaders = headers.filter((header) => header.level === 2);

  const [visible, setVisible] = useState(true);
  const [subscribePopupOpen, setSubscribePopupOpen] = useOverlayActive(
    "BlogToCSubscribe"
  );

  const ref = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    if (ref.current) {
      // @ts-ignore
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

  if (trackedHeaders.length < 3) {
    return null;
  }

  return (
    <>
      <div
        className={cn(styles.blogToC, {
          [styles.hide]: !visible,
        })}
        ref={ref}
      >
        <Link href="/blog">
          <a className={styles.iconLink}>
            <DiscArrowUpIcon />
            <span>all blog posts</span>
          </a>
        </Link>

        <ToC
          headers={trackedHeaders}
          sectionSelector={`.${baseStyles.rstWrapper} > .${blogStyles.section} > .${blogStyles.section}`}
        />

        <div className={styles.iconLinks}>
          <a href={twitHref} className={styles.iconLink} target="_blank">
            <TwitterIcon />
            <span>Tweet</span>
          </a>
          <div
            className={styles.iconLink}
            onClick={() => setSubscribePopupOpen(true)}
          >
            <BlogEmailIcon />
            <span>Subscribe</span>
          </div>
        </div>
      </div>
      {subscribePopupOpen ? (
        <SubscribePopup onClose={() => setSubscribePopupOpen(false)} />
      ) : null}
    </>
  );
}
