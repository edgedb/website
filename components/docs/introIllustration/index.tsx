import styles from "./introIllustration.module.scss";

export interface DocIntroIllustrationProps {
  name: string;
}

export default function DocIntroIllustration({
  name,
}: DocIntroIllustrationProps) {
  if (!styles[name]) {
    return <div className={styles.illustration_placeholder}></div>
  }

  return <div className={`${styles.illustration} ${styles[name]}`} />;
}
