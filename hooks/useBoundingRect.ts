import {RefObject, useEffect} from "react";

export function useBoundingRect(
  ref: RefObject<HTMLElement>,
  onResize: (rect: DOMRect) => void
) {
  useEffect(() => {
    if (ref.current) {
      // @ts-ignore
      const observer = new ResizeObserver(([entry]) => {
        onResize(entry.target.getBoundingClientRect());
      });

      observer.observe(ref.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [ref]);
}
