import {useEffect} from "react";

export interface PageBackgroundColourProps {
  pageBackgroundColour?: {
    light: string;
    dark?: string;
  };
  htmlClassName?: string;
}

export function usePageBackgroundColour(props: PageBackgroundColourProps) {
  const lightBg = props.pageBackgroundColour?.light ?? "#fff";
  const darkBg = props.pageBackgroundColour?.dark;

  useEffect(() => {
    document.body.style.setProperty("--lightBg", lightBg);
    document.body.style.setProperty("--darkBg", darkBg ?? null);
  }, [lightBg, darkBg]);

  return {
    "--pageLightBg": lightBg,
    "--pageDarkBg": darkBg,
  } as any;
}

export function useHtmlClass(className?: string): void {
  useEffect(() => {
    if (className) {
      const classes = className?.split(/\s+/).filter((c) => !!c);
      document.documentElement.classList.add(...classes);

      return () => {
        document.documentElement.classList.remove(...classes);
      };
    }
  }, [className]);
}
