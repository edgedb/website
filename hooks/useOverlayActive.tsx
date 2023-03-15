import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  Fragment,
} from "react";

import {useRouter} from "next/router";

interface OverlayState {
  id: string;
  shouldClose?: (targetUrl: string) => boolean;
}

export const OverlayContext = createContext<{
  activeOverlay: OverlayState | null;
  setActiveOverlay: (state: OverlayState | null) => void;
}>({
  activeOverlay: null,
  setActiveOverlay: (state: OverlayState | null) => {},
});

export function OverlayProvider({children}: React.PropsWithChildren<{}>) {
  const [activeOverlay, setActiveOverlay] = useState<OverlayState | null>(
    null
  );

  const router = useRouter();

  const scrollTop = useRef<number | null>(null);

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
      document.body.style.overflow = "";
      document.body.style.width = "";
      document.body.style.height = "";
      document.documentElement.scrollTop = scrollTop.current ?? 0;
      scrollTop.current = null;
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
      router.events.on("routeChangeStart", routeChangeHandler);

      const keypressHandler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          updateActiveOverlay(null);
        }
      };
      window.addEventListener("keydown", keypressHandler, {capture: true});

      return () => {
        router.events.off("routeChangeStart", routeChangeHandler);
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
      }}
    >
      <Fragment key="overlay">{children}</Fragment>
    </OverlayContext.Provider>
  );
}

export function useOverlayActive(
  overlayId: string,
  shouldClose?: (targetUrl: string) => boolean
): [boolean, (active: boolean) => void] {
  const {activeOverlay, setActiveOverlay} = useContext(OverlayContext);

  return [
    activeOverlay?.id === overlayId,
    (active: boolean) =>
      setActiveOverlay(active ? {id: overlayId, shouldClose} : null),
  ];
}

export function useIsOverlayActive(): boolean {
  const {activeOverlay} = useContext(OverlayContext);

  return activeOverlay !== null;
}
