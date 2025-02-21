import {PropsWithChildren, useEffect, useState} from "react";
import HeaderLink from "@edgedb-site/shared/components/headerLink";

import styles from "./faqItem.module.scss";

function FAQItem({title, children}: PropsWithChildren<{title: string}>) {
  const slug = title.toLowerCase().replace(/[^a-z]/g, "_");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (location.hash === `#${slug}`) {
      setOpen(true);
    }
  }, []);

  return (
    <details className={styles.faqItem} open={open}>
      <summary
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
      >
        <HeaderLink id={slug} element="div">
          {title}
        </HeaderLink>
      </summary>
      <div>{children}</div>
    </details>
  );
}

export default FAQItem;
