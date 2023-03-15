import {
  useState,
  useEffect,
  createContext,
  PropsWithChildren,
  useContext,
} from "react";

import {useRouter} from "next/router";

import {mediaQuery} from "./mediaQuery";

export const themeActivePaths = ["/docs", "/easy-edgedb", "/tutorial"];

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

const activePathRegex = new RegExp(`^(${themeActivePaths.join("|")})`);

export function ThemeProvider(props: PropsWithChildren<{}>) {
  const [colourTheme, setColourTheme] = useState(ColourTheme.System);
  const [actualTheme, setActualTheme] = useState(ColourTheme.Light);

  const router = useRouter();

  useEffect(() => {
    setColourTheme(
      (localStorage.getItem("colourTheme") as ColourTheme) ?? colourTheme
    );
  }, []);

  useEffect(() => {
    if (!activePathRegex.test(router.pathname)) {
      document.documentElement.dataset.theme = ColourTheme.Light;
    } else {
      document.documentElement.dataset.theme = colourTheme;
    }
  }, [router.pathname, colourTheme]);

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
    <ThemeContext.Provider
      value={{theme: colourTheme, actualTheme, changeTheme}}
    >
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
