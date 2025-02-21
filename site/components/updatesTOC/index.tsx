import {useEffect, useState} from "react";

import scrollIntoView from "smooth-scroll-into-view-if-needed";
import {useVisibleElement} from "@edgedb-site/shared/hooks/useVisibleElement";
import cn from "@edgedb-site/shared/utils/classNames";
import blogStyles from "@/styles/blogPost.module.scss";
import styles from "./updatesTOC.module.scss";

interface UpdatesToCProps {
  headers: {title: string; id: string}[];
}

export default function UpdatesToC({headers}: UpdatesToCProps) {
  if (headers.length < 3) {
    return null;
  }

  const [activeId, setActiveId] = useState(headers[0].id);

  useVisibleElement(
    () => {
      const headerIds = new Set(headers.map((header) => header.id));

      const els = [
        ...document.querySelectorAll<HTMLElement>(`.${blogStyles.section}`),
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

  function customBoundary(parent: HTMLElement, child: Element) {
    const rect = child.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    if (rect.bottom > parentRect.bottom) {
      parent.scrollTop += rect.bottom - parentRect.bottom + 30;
    }

    if (rect.top < parentRect.top) {
      parent.scrollTop -= parentRect.top - rect.top + 30;
    }

    return false;
  }

  useEffect(() => {
    const parent = document.getElementById("scrollableTOC");
    const child = document.querySelector(`.${styles.active}`);

    if (child) {
      scrollIntoView(child, {
        scrollMode: "if-needed",
        block: "nearest",
        boundary: customBoundary.bind(null, parent!),
      });
    }
  }, [activeId]);

  return (
    <div className={styles.container}>
      <ul className={styles.toc} id="scrollableTOC">
        {headers.map((header) => (
          <a href={`#${header.id}`} key={header.id}>
            <li
              className={cn(styles.item, {
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

              <span>{header.title}</span>
            </li>
          </a>
        ))}
      </ul>
    </div>
  );
}
