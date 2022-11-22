import cn from "@/utils/classNames";

import styles from "./search.module.scss";

import {SearchIcon} from "@/components/icons";
import {useSearchContext} from "./context";

export function SearchNoteButton() {
  const {setPanelOpen} = useSearchContext();

  return (
    <div className={styles.searchNote} onClick={() => setPanelOpen(true)}>
      <KeyboardKey val="/" />{" "}
      <span className={styles.underlined}>to search</span>
    </div>
  );
}

export function SearchMiniButton() {
  const {setPanelOpen} = useSearchContext();

  return (
    <div className={styles.miniButton} onClick={() => setPanelOpen(true)}>
      <SearchIcon />
    </div>
  );
}

interface KeyboardKeyProps {
  val: string;
  width?: number;
  className?: string;
}

function KeyboardKey({val, width, className}: KeyboardKeyProps) {
  const w = width ?? 22;
  return (
    <kbd className={cn(styles.keyboardKey, className)}>
      <svg viewBox={`0 0 ${w} 22`} width={w} height="22">
        <rect
          x="1"
          y="1"
          width={w - 2}
          height="20"
          rx="2"
          fill="none"
          strokeWidth="1"
          stroke="currentColor"
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          x={w / 2}
          y="11"
        >
          {val}
        </text>
      </svg>
    </kbd>
  );
}
