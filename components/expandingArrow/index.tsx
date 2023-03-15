import cn from "@/utils/classNames";

import styles from "./expandingArrow.module.scss";

interface ExpandingArrowProps {
  className?: string;
  height: number;
  strokeWidth: number;
  width: number;
  expandBy: number;
  expandBox?: boolean;
}

export default function ExpandingArrow({
  className,
  height,
  strokeWidth,
  width,
  expandBy,
  expandBox,
}: ExpandingArrowProps) {
  const w = width - strokeWidth;
  const h = height - strokeWidth;

  return (
    <svg
      className={cn(
        styles.expandingArrow,
        {[styles.expandBox]: !!expandBox},
        className
      )}
      width={width + expandBy}
      height={height}
      viewBox={`-${strokeWidth / 2} -${strokeWidth / 2} ${
        width + expandBy
      } ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={
        {
          strokeWidth: strokeWidth + "px",
          "--expandArrowBy": expandBy,
        } as any
      }
    >
      <path d={`M 0 ${h / 2} H ${w - 1}`} />
      <path
        className={styles.arrowLine}
        d={`M ${w - 2} ${h / 2} h 2`}
        style={{
          transformOrigin: `${w - 2}px`,
        }}
      />
      <path
        className={styles.arrowHead}
        d={`M ${w - h / 2} 0 l ${h / 2} ${h / 2} l -${h / 2} ${h / 2}`}
      />
    </svg>
  );
}
