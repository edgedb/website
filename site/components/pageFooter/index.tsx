import cn from "@edgedb-site/shared/utils/classNames";

import {
  FooterLinks as _FooterLinks,
  FooterContent,
  type PageFooterProps,
} from "@edgedb-site/shared/components/pageFooter";

import styles from "./pageFooter.module.scss";

const FooterLinks = (props: {className?: string}) => (
  <_FooterLinks hostname="www.edgedb.com" {...props} />
);

export {FooterLinks};

export default function PageFooter({
  className,
  minimal,
  theme = "dark",
}: Omit<PageFooterProps, "hostname">) {
  return (
    <footer className={cn(styles.pageFooter, className)}>
      <div data-theme={theme}>
        <FooterContent
          className={styles.footerContent}
          linksClassName={cn(styles.footerLinks, {
            [styles.minimal]: !!minimal,
          })}
          hostname="www.edgedb.com"
          minimal={minimal}
        />
      </div>
    </footer>
  );
}
