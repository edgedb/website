import Link from "next/link";
import cn from "@/utils/classNames";

import _ExpandingArrow from "@/components/expandingArrow";

import styles from "./arrowButton.module.scss";

const ExpandingArrow = () => (
  <_ExpandingArrow
    className={styles.expandingArrow}
    strokeWidth={2}
    height={10}
    width={18}
    expandBy={8}
  />
);

export interface ArrowButtonProps {
  href: string;
  label: string;
  subLabel?: string;
  className?: string;
  direction?: "left" | "right";
  icon?: JSX.Element;
}

export default function ArrowButton({
  href,
  label,
  subLabel,
  className,
  direction = "right",
  icon,
}: ArrowButtonProps) {
  return (
    <Link href={href}>
      <a
        className={cn(styles.arrowButton, className, {
          [styles.leftArrow]: direction === "left",
        })}
      >
        {icon ? <div className={styles.icon}>{icon}</div> : null}
        <div>
          {subLabel ? <span>{subLabel}</span> : null}
          {label}
        </div>
        <ExpandingArrow />
      </a>
    </Link>
  );
}
