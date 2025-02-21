import {ReactNode} from "react";

import cn from "@edgedb-site/shared/utils/classNames";
import styles from "./decoratedSection.module.scss";

export enum DECORATION_TYPES {
  BEHIND = "behind",
  BEFORE = "before",
}

interface DecoratedSectionProps {
  title: string;
  decorationText: string;
  decorationType?: DECORATION_TYPES;
  children: ReactNode;
  classes?: string;
}

export default function DecoratedSection({
  title,
  decorationText,
  decorationType,
  children,
  classes,
}: DecoratedSectionProps) {
  return (
    <div
      className={cn(classes, styles.decoratedSection, {
        [styles.decorationBefore]: decorationType === DECORATION_TYPES.BEFORE,
      })}
    >
      <div className={styles.header}>
        <span className={styles.decoration}>{decorationText}</span>
        <h5 className={styles.title}>{title}</h5>
      </div>
      <div className={styles.children}>{children}</div>
    </div>
  );
}
