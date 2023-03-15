import Link from "next/link";

import cn from "@/utils/classNames";

import styles from "./footernav.module.scss";

interface PrevNextInfo {
  url: string;
  categoryTitle?: string;
}

interface TutorialFooterNavProps {
  prev: PrevNextInfo | null;
  next: PrevNextInfo | null;
}

export default function TutorialFooterNav({
  prev,
  next,
}: TutorialFooterNavProps) {
  return (
    <div className={styles.nav}>
      <Link href={prev?.url ?? ""}>
        <a
          className={cn(styles.button, {
            [styles.disabled]: !prev,
          })}
        >
          <span>
            <ChevronIcon />
            Prev
          </span>
        </a>
      </Link>
      <Link href={next?.url ?? ""}>
        <a
          className={cn(styles.button, styles.next, {
            [styles.disabled]: !next,
          })}
        >
          <span>
            Next
            <ChevronIcon />
          </span>
          {next?.categoryTitle ? (
            <span className={styles.nextCat}>{next.categoryTitle}</span>
          ) : null}
        </a>
      </Link>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="17"
      height="18"
      viewBox="0 0 17 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="1.41406"
        y1="9.00009"
        x2="8.48513"
        y2="1.92903"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="1.41421"
        y1="9"
        x2="8.48528"
        y2="16.0711"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
