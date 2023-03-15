import cn from "@/utils/classNames";

import styles from "./controlBar.module.scss";

interface ControlBarProps {
  items: {
    icon?: JSX.Element;
    label?: string;
    action: () => void;
    disabled?: boolean;
    active?: boolean;
    style?: string;
    hideOnMobile?: boolean;
  }[];
  errorMessage?: string;
}

export default function ControlBar({items, errorMessage}: ControlBarProps) {
  return (
    <div className={styles.controlsPanel}>
      {errorMessage ? (
        <div className={styles.errMessage}>{errorMessage}</div>
      ) : null}
      <div className={styles.controlsOuter}>
        <div className={styles.controls}>
          {items.map((item, i) => (
            <button
              className={cn(styles.button, item.style, {
                [styles.active]: !!item.active,
                [styles.hideOnMobile]: !!item.hideOnMobile,
              })}
              key={i}
              onClick={item.action}
              disabled={item.disabled}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
