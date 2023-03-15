import {useState, useEffect} from "react";

import cn from "@/utils/classNames";

import {ColourTheme, useTheme} from "hooks/useTheme";
import {LightThemeIcon, DarkThemeIcon, SystemThemeIcon} from "./icons";

import styles from "./themeSwitcher.module.scss";

interface ThemeSwitcherProps {
  className?: string;
}

export default function ThemeSwitcher({className}: ThemeSwitcherProps) {
  const {theme, changeTheme} = useTheme();

  const [popupOpen, setPopupOpen] = useState(false);
  const [openProgress, setOpenProgress] = useState(0);

  useEffect(() => {
    if (popupOpen) {
      window.addEventListener(
        "click",
        () => {
          setPopupOpen(false);
          setOpenProgress(0);
        },
        {
          capture: true,
          once: true,
        }
      );
    }
  });

  const isFullyOpen = openProgress === 5;

  return (
    <div className={cn(styles.themeSwitcher, className)}>
      <div className={styles.button} onClick={() => setPopupOpen(true)}>
        <LightThemeIcon className={styles.lightIcon} />
        <DarkThemeIcon className={styles.darkIcon} />
      </div>
      <div
        className={cn(styles.popup, {
          [styles.popupOpen]: popupOpen,
          [styles.fullyOpen]: isFullyOpen,
        })}
        onTransitionEnd={(e) => {
          if (popupOpen) {
            setOpenProgress(openProgress + 1);
          }
        }}
      >
        <div
          className={cn(styles.button, {
            [styles.active]: theme === ColourTheme.Light,
          })}
          onClick={() => changeTheme(ColourTheme.Light)}
        >
          <LightThemeIcon />
          <div className={cn(styles.tooltip, styles.left)}>Light</div>
        </div>
        <div
          className={cn(styles.button, {
            [styles.active]: theme === ColourTheme.Dark,
          })}
          onClick={() => changeTheme(ColourTheme.Dark)}
        >
          <DarkThemeIcon />
          <div className={styles.tooltip}>Dark</div>
        </div>
        <div
          className={cn(styles.button, {
            [styles.active]: theme === ColourTheme.System,
          })}
          onClick={() => changeTheme(ColourTheme.System)}
        >
          <SystemThemeIcon />
          <div className={cn(styles.tooltip, styles.right)}>System</div>
        </div>
      </div>
    </div>
  );
}
