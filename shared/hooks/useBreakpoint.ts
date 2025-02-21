"use client";

import { useState, useEffect } from "react";

const breakpoints = [
  { name: "xs", width: 320 },
  { name: "sm", width: 768 },
  { name: "md", width: 1024 },
  { name: "lg", width: 1440 },
  { name: "xl", width: 1920 },
  { name: "xxl", width: 2560 },
] as const;

function resolveBreakpoint(windowWidth: number) {
  for (const { name, width } of breakpoints) {
    if (windowWidth < width) return name;
  }
  return "max";
}

let initialBreakpoint = "max" as (typeof breakpoints)[number]["name"] | "max";

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<
    (typeof breakpoints)[number]["name"] | "max"
  >(initialBreakpoint);

  useEffect(() => {
    const listener = () => {
      const newBreakpoint = resolveBreakpoint(
        document.documentElement.clientWidth
      );

      setBreakpoint(newBreakpoint);
      return newBreakpoint;
    };

    window.addEventListener("resize", listener);
    initialBreakpoint = listener();

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, []);

  return breakpoint;
}
