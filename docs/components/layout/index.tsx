import React from "react";
import cn from "@edgedb-site/shared/utils/classNames";
import PageFooter from "@edgedb-site/shared/components/pageFooter";
import styles from "./layout.module.scss";

import { MobileSearchButton } from "@/components/search/buttons";
import { MobileAskAIButton } from "@/components/gpt/buttons";

export function Layout({
  children,
  className,
  mobileControlsClassName,
}: React.PropsWithChildren<{
  className?: string;
  mobileControlsClassName?: string;
}>) {
  return (
    <div className={cn(styles.layout, className)}>
      {children}
      <MobileControls className={mobileControlsClassName}>
        <MobileSearchButton />
        <MobileAskAIButton />
      </MobileControls>
    </div>
  );
}

export function Main({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={styles.main}>
      <main className={className}>{children}</main>
      <div className={styles.bottomShadow} />
      <Footer>
        <PageFooter hostname="docs.edgedb.com" />
      </Footer>
    </div>
  );
}

export function Footer({ children }: React.PropsWithChildren) {
  return <div className={styles.footer}>{children}</div>;
}

export function LeftSidebar({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn(styles.leftSidebar, className)}>{children}</div>;
}

export function RightSidebar({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn(styles.rightSidebar, className)}>{children}</div>;
}

function MobileControls({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn(styles.mobileControls, className)}>{children}</div>;
}
