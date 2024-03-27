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
}: Omit<PageFooterProps, "hostname">) {
  return (
    <footer
      className={cn(styles.pageFooter, className, {
        [styles.minimal]: !!minimal,
      })}
    >
      <div className="globalPageWrapper">
        <FooterContent
          className={styles.footerContent}
          linksClassName={styles.footerLinks}
          hostname="www.edgedb.com"
          minimal={minimal}
        />
      </div>
    </footer>
  );
}
