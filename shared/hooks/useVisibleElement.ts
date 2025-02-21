import {useEffect} from "react";

/**
 * React hook to watch an array of `HTMLElement`'s and trigger a callback when
 * the dominant element visible in the viewport changes. The dominant
 * visible element is determined as the element that covers most of the middle
 * 50% of the viewport vertically.
 *
 * @param elements  Array of `HTMLElement`'s to watch. Can be a function that
 *                  returns an array of `HTMLElement`'s, which only gets called
 *                  once on setup of watcher; useful if array is expensive to
 *                  calculate.
 * @param onVisibilityChange  Callback when the dominant visible element changes.
 * @param deps  Dependencies that when changed will trigger watcher setup to be
 *              run again. (Same as `useEffect` hook)
 */
export function useVisibleElement(
  elements: HTMLElement[] | (() => HTMLElement[]),
  onVisibilityChange: (element: HTMLElement | null) => void,
  deps?: React.DependencyList
): void {
  useEffect(() => {
    const visibleElements: Set<HTMLElement> = new Set();
    let visibleElement: HTMLElement | null = null;
    let pending = false;
    let watching = false;

    // IntersectionObserver is used to efficiently track which of the
    // elements intersect with the viewport.
    // Also deactivates scroll listener while no observed elements
    // are visible.
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visibleElements.add(entry.target as HTMLElement);
        } else {
          visibleElements.delete(entry.target as HTMLElement);
        }
      }
      if (visibleElements.size && !watching) {
        window.addEventListener("scroll", onScroll, {passive: true});
        onScroll();
      } else if (!visibleElements.size && watching) {
        window.removeEventListener("scroll", onScroll);
      }
    });

    const els = typeof elements === "function" ? elements() : elements;

    for (const el of els) {
      observer.observe(el);
    }

    // Called on scroll of the page (debounced by requestAnimationFrame) and
    // loops through elements determined by IntersectionObserver to be visible
    // and calls callback with the element covering the most of the central 35%
    // of the page.
    function update() {
      let overlap = 0;
      let visibleEl: HTMLElement | null = null;

      const windowHeight = document.documentElement.clientHeight;

      const topBoundary = 80;
      const bottomBoundary = windowHeight * (1 / 3);

      for (const el of visibleElements) {
        const bbox = el.getBoundingClientRect();
        const overlapTop = Math.max(bbox.top, topBoundary);
        const overlapBottom = Math.min(bbox.bottom, bottomBoundary);

        const elOverlap = overlapBottom - overlapTop;
        if (elOverlap > overlap) {
          overlap = elOverlap;
          visibleEl = el;
        }
      }

      if (visibleEl !== visibleElement) {
        visibleElement = visibleEl;
        onVisibilityChange(visibleElement);
      }
    }

    function onScroll() {
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => {
          update();
          pending = false;
        });
      }
    }

    return () => {
      observer.disconnect();
      if (watching) {
        window.removeEventListener("scroll", onScroll);
      }
    };
  }, deps);
}
