"use client";

import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  Fragment,
} from "react";

import type { NextRouter } from "next/router";

type OverlayState = {
  id: string;
  type?: string | null;
  shouldClose?: (targetUrl: string) => boolean;
  ignoreEsc?: boolean;
  data?: any;
};

export const OverlayContext = createContext<{
  activeOverlay: OverlayState | null;
  setActiveOverlay: (state: OverlayState | null) => void;
  reEnableScrolling: () => void;
}>({
  activeOverlay: null,
  setActiveOverlay: (state: OverlayState | null) => {},
  reEnableScrolling: () => {},
});

export function OverlayProvider({
  router,
  children,
}: React.PropsWithChildren<{ router?: NextRouter }>) {
  const [activeOverlay, setActiveOverlay] = useState<OverlayState | null>(null);

  const scrollTop = useRef<number | null>(null);

  const reEnableScrolling = () => {
    if (scrollTop.current !== null) {
      document.body.style.overflow = "";
      document.body.style.width = "";
      document.body.style.height = "";
      document.documentElement.scrollTop = scrollTop.current ?? 0;
      scrollTop.current = null;
    }
  };

  const updateActiveOverlay = (state: OverlayState | null) => {
    if (activeOverlay?.id === state?.id || (activeOverlay && state)) {
      return;
    }

    setActiveOverlay(state);
    if (state) {
      scrollTop.current = document.documentElement.scrollTop;
      document.body.style.overflow = "hidden";
      document.body.style.width = "100%";
      document.body.style.height = "100vh";
      document.body.scrollTop = scrollTop.current;
    } else {
      reEnableScrolling();
    }
  };

  useEffect(() => {
    if (activeOverlay) {
      const routeChangeHandler = (url: string) => {
        if (!activeOverlay.shouldClose || activeOverlay.shouldClose(url)) {
          updateActiveOverlay(null);
        } else {
          scrollTop.current = null;
        }
      };
      router?.events.on("routeChangeStart", routeChangeHandler);

      let keypressHandler: ((e: KeyboardEvent) => void) | null = null;

      if (!activeOverlay.ignoreEsc) {
        keypressHandler = (e: KeyboardEvent) => {
          if (e.key === "Escape") {
            e.preventDefault();
            updateActiveOverlay(null);
          }
        };
        window.addEventListener("keydown", keypressHandler, { capture: true });
      }

      return () => {
        router?.events.off("routeChangeStart", routeChangeHandler);
        keypressHandler &&
          window.removeEventListener("keydown", keypressHandler, {
            capture: true,
          });
      };
    }
  }, [activeOverlay?.id]);

  return (
    <OverlayContext.Provider
      value={{
        activeOverlay,
        setActiveOverlay: updateActiveOverlay,
        reEnableScrolling,
      }}
    >
      <Fragment key="overlay">{children}</Fragment>
    </OverlayContext.Provider>
  );
}

export function useOverlayActive(
  overlayId: string,
  opts?: {
    shouldClose?: (targetUrl: string) => boolean;
    ignoreEsc?: boolean;
    data?: any;
  }
): [boolean, (active: boolean) => void, string | null, any, () => void] {
  const { activeOverlay, setActiveOverlay, reEnableScrolling } =
    useContext(OverlayContext);

  return [
    activeOverlay?.id === overlayId,
    (active: boolean) =>
      setActiveOverlay(active ? { id: overlayId, ...opts } : null),
    activeOverlay?.id ?? null,
    activeOverlay?.data,
    reEnableScrolling,
  ];
}

export function useIsOverlayActive(): boolean {
  const { activeOverlay } = useContext(OverlayContext);

  return activeOverlay !== null;
}

export function useOverlayTypeActive<T extends string>(
  id: string
): [T | null, (type: T | null) => void] {
  const { activeOverlay, setActiveOverlay } = useContext(OverlayContext);

  return [
    activeOverlay?.type as T | null,
    (type: T | null) => setActiveOverlay(type ? { id, type } : null),
  ];
}
