import {useState} from "react";

import cn from "@edgedb-site/shared/utils/classNames";
import {useVisibleElement} from "@edgedb-site/shared/hooks/useVisibleElement";

import styles from "./toc.module.scss";

interface ToCProps {
  headers: {
    id: string;
    title: string;
    badge?: JSX.Element | undefined;
    faded?: boolean;
  }[];
  sectionSelector: string;
  className?: string;
  isCurrentVersionDev?: boolean;
}

export default function ToC({headers, sectionSelector, className}: ToCProps) {
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
    <ul className={cn(styles.toc, className)}>
      {headers.map((header) => (
        <a href={`#${header.id}`} key={header.id}>
          <li
            className={cn({
              [styles.active]: header.id === activeId,
            })}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                fill="currentColor"
              />
            </svg>

            <span className={cn({[styles.faded]: !!header.faded})}>
              {header.title}
              {header.badge}
            </span>
          </li>
        </a>
      ))}
    </ul>
  );
}
