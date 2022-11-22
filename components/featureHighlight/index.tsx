import styles from "./featureHighlight.module.scss";
import {ReactNode} from "react";

interface FeatureHighlightProps {
  Icon?: () => JSX.Element;
  textDecoration?: string;
  title: string;
  body: ReactNode;
}

export function FeatureHighlightHeader({
  title,
  textDecoration,
}: Omit<FeatureHighlightProps, "body" | "Icon">) {
  return (
    <div className={styles.header}>
      {textDecoration && <p className={styles.decoration}>{textDecoration}</p>}
      <p className={styles.title}>{title}</p>
    </div>
  );
}

export default function FeatureHighlight({
  Icon,
  title,
  body,
  textDecoration,
}: FeatureHighlightProps) {
  return (
    <div className={styles.featureHighlight}>
      {Icon ? (
        <div className={styles.icon}>
          <Icon />
        </div>
      ) : null}
      <div className={styles.content}>
        <FeatureHighlightHeader
          title={title}
          textDecoration={textDecoration}
        />
        {body && <p className={styles.body}>{body}</p>}
      </div>
    </div>
  );
}
