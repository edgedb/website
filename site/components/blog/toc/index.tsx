import {useEffect, useState, useRef} from "react";

import cn from "@edgedb-site/shared/utils/classNames";

import ToC from "@/components/toc";
import {Header} from "@edgedb-site/shared/xmlRenderer";

import styles from "./toc.module.scss";
import baseStyles from "@edgedb-site/shared/xmlRenderer/base.module.scss";
import blogStyles from "@/styles/blogPost.module.scss";

interface BlogToCProps {
  headers: Header[];
}

export default function BlogToC({headers}: BlogToCProps) {
  const trackedHeaders = headers.filter((header) => header.level === 2);

  const [visible, setVisible] = useState(true);

  const ref = useRef<HTMLDivElement>(null);

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

  if (trackedHeaders.length < 3) {
    return null;
  }

  return (
    <div
      className={cn(styles.blogToC, {
        [styles.hide]: !visible,
      })}
      ref={ref}
    >
      <ToC
        headers={trackedHeaders}
        sectionSelector={`.${baseStyles.rstWrapper} > .${blogStyles.section} > .${blogStyles.section}`}
      />
    </div>
  );
}
