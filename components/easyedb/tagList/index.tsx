import cn from "@/utils/classNames";

import styles from "./tagList.module.scss";

interface TagListProps {
  className?: string;
  tags: string[];
}

export default function TagList({tags, className}: TagListProps) {
  return (
    <div className={cn(styles.tags, className)}>
      {tags.map((tag, i) => (
        <span key={i}>{tag}</span>
      ))}
    </div>
  );
}
