import {useState, useEffect, useRef, RefObject} from "react";

import cn from "@edgedb/common/utils/classNames";

import styles from "./customScrollbar.module.scss";

export default function ScrollBar({
  scrollRef,
}: {
  scrollRef: RefObject<HTMLElement>;
}) {
  const [height, setHeight] = useState({client: 0, scroll: 0});

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;

      const updateHeight = () => {
        const {clientHeight: client, scrollHeight: scroll} = el;
        if (height.client !== client || height.scroll !== scroll) {
          setHeight({client, scroll});
        }
      };

      updateHeight();

      window.addEventListener("resize", updateHeight, {passive: true});

      return () => {
        window.removeEventListener("resize", updateHeight);
      };
    }
  });

  return <ScrollBarInner scrollRef={scrollRef} height={height} />;
}

function ScrollBarInner({
  scrollRef,
  height,
}: {
  scrollRef: RefObject<HTMLElement>;
  height: {client: number; scroll: number};
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [dragging, setDragging] = useState(false);

  const scrollbarRef = useRef<HTMLDivElement>(null);
  const scrollbarHeight = useRef(0);

  useEffect(() => {
    if (scrollRef.current && scrollbarRef.current) {
      const el = scrollRef.current;

      const handler = () => {
        setScrollTop(el.scrollTop);
      };

      el.addEventListener("scroll", handler, {passive: true});

      scrollbarHeight.current = scrollbarRef.current?.clientHeight ?? 0;

      const observer = new ResizeObserver(() => {
        scrollbarHeight.current = scrollbarRef.current?.clientHeight ?? 0;
      });

      observer.observe(scrollRef.current);

      return () => {
        el.removeEventListener("scroll", handler);
        observer.disconnect();
      };
    }
  }, [scrollRef, scrollbarRef]);

  const barHeight = height.client / (height.scroll || 1);
  const barTop =
    ((scrollTop / (height.scroll - height.client || scrollTop)) *
      (1 - barHeight)) /
    (barHeight || 1);

  return (
    <div
      className={cn(styles.scrollBar, {
        [styles.hideScrollbar]: barHeight >= 1,
      })}
      ref={scrollbarRef}
    >
      <div
        className={cn(styles.scrollHandle, {
          [styles.dragging]: dragging,
        })}
        style={{
          height: `calc(${barHeight * 100}% + 2px)`,
          transform: `translateY(${barTop * 100}%)`,
        }}
        onMouseDown={(e) => {
          const startMouseY = e.clientY;
          const startScrollY = scrollRef.current?.scrollTop ?? 0;

          setDragging(true);

          const mouseMoveHandler = (e: MouseEvent) => {
            if (scrollRef.current) {
              const deltaY = e.clientY - startMouseY;
              const deltaYpercent =
                deltaY / ((1 - barHeight) * scrollbarHeight.current || 1);
              const scrollDelta =
                (height.scroll - height.client) * deltaYpercent;

              scrollRef.current.scrollTop = startScrollY + scrollDelta;
            }
          };

          window.addEventListener("mousemove", mouseMoveHandler);
          window.addEventListener(
            "mouseup",
            () => {
              window.removeEventListener("mousemove", mouseMoveHandler);
              setDragging(false);
            },
            {once: true}
          );
        }}
      />
    </div>
  );
}
