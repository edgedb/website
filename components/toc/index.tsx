import {useState} from "react";

import cn from "@/utils/classNames";
import {useVisibleElement} from "hooks/useVisibleElement";

import styles from "./toc.module.scss";

interface ToCProps {
  headers: {
    id: string;
    title: string;
    badge?: string;
    faded?: boolean;
  }[];
  sectionSelector: string;
  className?: string;
  rightAlign?: boolean;
}

export default function ToC({
  headers,
  sectionSelector,
  className,
  rightAlign,
}: ToCProps) {
  const [activeId, setActiveId] = useState<string | null>(headers[0]?.id);

  useVisibleElement(
    () => {
      const headerIds = new Set(headers.map((header) => header.id));

      const els = [
        ...document.querySelectorAll<HTMLElement>(sectionSelector),
      ].filter((el) => {
        return headerIds.has(el.dataset.sectionId ?? "");
      });
      return els;
    },
    (el) => {
      if (el) {
        setActiveId(el.dataset.sectionId!);
      }
    },
    [headers]
  );

  return (
    <ul
      className={cn(styles.toc, className, {
        [styles.rightAlign]: !!rightAlign,
      })}
    >
      {headers.map((header) => (
        <a href={`#${header.id}`} key={header.id}>
          <li className={cn({[styles.active]: header.id === activeId})}>
            <svg
              className={styles.line}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              preserveAspectRatio="none"
            >
              <path d="M 8 0 v 0 16" />
            </svg>
            <svg
              className={styles.ring}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
            >
              <circle cx="8" cy="8" r="6.5"></circle>
            </svg>
            <svg
              className={styles.dot}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
            >
              <circle cx="8" cy="8" r="3.5"></circle>
            </svg>
            <span className={cn({[styles.faded]: !!header.faded})}>
              {header.title}
              {header.badge ? (
                <span className={styles.badge}>{header.badge}</span>
              ) : null}
            </span>
          </li>
        </a>
      ))}
    </ul>
  );
}
