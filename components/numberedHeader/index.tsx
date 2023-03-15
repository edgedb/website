import cn from "@/utils/classNames";

import styles from "./numberedHeader.module.scss";

interface NumberedHeaderProps {
  number: string;
  text: string;
  style?: "floatGray" | "overlapColor";
}

export default function NumberedHeader(props: NumberedHeaderProps) {
  const {style = "float", number, text} = props;
  return (
    <h3 className={cn(styles[style])}>
      <p className={styles.number}>{number}</p>
      <p className={styles.text}>{text}</p>
    </h3>
  );
}
