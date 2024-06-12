"use client";

import {
  useState,
  useEffect,
  createContext,
  PropsWithChildren,
  useContext,
} from "react";

import { useRouter } from "next/router";

import { mediaQuery } from "./mediaQuery";

export enum ColourTheme {
  Light = "light",
  Dark = "dark",
  System = "system",
}

export const ThemeContext = createContext({
  theme: ColourTheme.System,
  actualTheme: ColourTheme.Light,
  changeTheme: (theme: ColourTheme) => {},
});

export function ThemeProvider({
  activePaths,
  children,
}: PropsWithChildren<{ activePaths?: string[] }>) {
  const [colourTheme, setColourTheme] = useState(ColourTheme.System);
  const [actualTheme, setActualTheme] = useState(ColourTheme.Light);

  const activePathRegex = activePaths?.length
    ? new RegExp(`^(${activePaths.join("|")})`)
    : null;

  let pathname = "";
  if (activePaths) {
    pathname = useRouter().pathname;
  }

  useEffect(() => {
    setColourTheme(
      (localStorage.getItem("colourTheme") as ColourTheme) ?? colourTheme
    );
  }, []);

  useEffect(() => {
    if (activePaths && (!activePathRegex || !activePathRegex.test(pathname))) {
      document.documentElement.dataset.theme = ColourTheme.Light;
    } else {
      document.documentElement.dataset.theme = colourTheme;
    }
  }, [pathname, colourTheme]);

  useEffect(() => {
    if (colourTheme === ColourTheme.System) {
      return mediaQuery(
        "(prefers-color-scheme: dark)",
        (mq) =>
          setActualTheme(mq.matches ? ColourTheme.Dark : ColourTheme.Light),
        true
      );
    } else {
      setActualTheme(colourTheme);
    }
  }, [colourTheme]);

  const changeTheme = (theme: ColourTheme) => {
    setColourTheme(theme);
    localStorage.setItem("colourTheme", theme);
  };

  return (
    <div
      style={{ display: "contents" }}
      className={actualTheme === ColourTheme.Dark ? "dark-theme" : undefined}
    >
      <ThemeContext.Provider
        value={{ theme: colourTheme, actualTheme, changeTheme }}
      >
        {children}
      </ThemeContext.Provider>
    </div>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
