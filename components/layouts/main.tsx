import {PropsWithChildren} from "react";

import cn from "@/utils/classNames";

import {
  PageBackgroundColourProps,
  useHtmlClass,
  usePageBackgroundColour,
} from "./_base";

import styles from "./layout.module.scss";

import PageHeader from "@/components/pageNav";
import PageFooter from "@/components/pageFooter";
import {CloudBanner} from "../globalBanner";

interface MainLayoutProps extends PageBackgroundColourProps {
  className?: string;
  headerInjectComponent?: JSX.Element;
  footerClassName?: string;
  minimalFooter?: boolean;
  hideGlobalBanner?: boolean;
  layout?: "absolute";
}

export default function MainLayout(props: PropsWithChildren<MainLayoutProps>) {
  const pageBgStyles = usePageBackgroundColour(props);

  useHtmlClass(props.htmlClassName);

  return (
    <>
      <div
        className={cn(styles.mainLayout, props.className)}
        style={pageBgStyles}
      >
        {/* {props.hideGlobalBanner ? null : <CloudBanner />} */}
        <PageHeader injectElement={props.headerInjectComponent} />
        <div
          className={
            props.layout === "absolute" ? undefined : styles.pageChildren
          }
        >
          {props.children}
        </div>
        <PageFooter
          className={props.footerClassName}
          minimal={props.minimalFooter}
        />
      </div>
      <div id="themeSwitcherPortalTarget" />
    </>
  );
}
