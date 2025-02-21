import {PropsWithChildren} from "react";

import cn from "@edgedb-site/shared/utils/classNames";

import styles from "./layout.module.scss";

import PageHeader from "@/components/pageNav";
import PageFooter from "@/components/pageFooter";

interface MainLayoutProps {
  className?: string;
  skipPageHeader?: boolean;
  footerClassName?: string;
  minimalFooter?: boolean;
  hideGlobalBanner?: boolean;
  style?: {readonly [key: string]: string};
  layout?: "absolute";
}

export default function MainLayout(props: PropsWithChildren<MainLayoutProps>) {
  return (
    <>
      <div
        className={cn(styles.mainLayout, props.className)}
        style={props.style}
      >
        {!props.skipPageHeader && <PageHeader />}
        {props.children}
        <PageFooter
          className={props.footerClassName}
          minimal={props.minimalFooter}
        />
      </div>
      <div id="themeSwitcherPortalTarget" />
    </>
  );
}
