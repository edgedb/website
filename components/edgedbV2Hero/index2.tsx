import {debounceToAnimationFrame} from "@/utils/debounce";
import Head from "next/head";
import {useEffect, useRef, useState} from "react";
import ExpandingArrow from "../expandingArrow";
import Spacer from "../spacer";
import styles from "./edgedbV2Hero.module.scss";

export default function EdgeDBDayV2Post() {
  return (
    <div className={styles.container}>
      <Head>
        <script
          id="luma-checkout"
          src="https://embed.lu.ma/checkout-button.js"
        ></script>
      </Head>
      <EdgeDBDayShip />
      <div className={styles.layout}>
        <div className={styles.infoColumn}>
          <h2>EdgeDB 2.0 has landed!</h2>
          <p>
            The world's favorite graph-relational database is back for an
            action-packed sequel. With the introduction of{" "}
            <b>access policies</b>, the
            <b>
              <code>GROUP</code>
            </b>{" "}
            statement, a new <b>admin UI</b>, EdgeDB is more powerful than
            ever.
          </p>
          <div className={styles.registerRow}>
            <a href="/blog/edgedb-2-0" className={styles.register}>
              <span>Read the announcement</span>
              <ExpandingArrow
                className={styles.expandingArrow}
                strokeWidth={2}
                height={10}
                width={18}
                expandBy={8}
              />
            </a>
            <Spacer w="20px" />
            <a
              className={styles.scheduleLink}
              href="https://www.youtube.com/watch?v=1jloGHV31Ow"
            >
              Watch the launch livestream
            </a>
          </div>
        </div>
        <Spacer flex="45px" />
        <div className={styles.spacerColumn}></div>
      </div>
    </div>
  );
}

function ScheduleRow(props: {title: string; time: string}) {
  return (
    <div className={styles.scheduleColumnRow}>
      <p className={styles.scheduleColumnRowTitle}>{props.title}</p>
      <Spacer w="15px" />
      <p className={styles.scheduleColumnRowTime}>{props.time}</p>
    </div>
  );
}
function EdgeDBDayShip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState([0, 0]);

  useEffect(() => {
    const isTouch = "ontouchstart" in document.documentElement;

    let x = 0;
    let y = 0;
    let lastScrollTop = document.documentElement.scrollTop;

    const listener = debounceToAnimationFrame((e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      x = e.clientX - (rect.x + rect.width / 2);
      y = e.clientY - (rect.y + rect.height / 2);
      setMousePos([x, y]);
    });

    const scrollListener = debounceToAnimationFrame(() => {
      y = y + document.documentElement.scrollTop - lastScrollTop;
      lastScrollTop = document.documentElement.scrollTop;
      setMousePos([x, y]);
    });

    if (!isTouch) {
      window.addEventListener("mousemove", listener, {passive: true});
    }
    document.addEventListener("scroll", scrollListener, {passive: true});

    return () => {
      if (!isTouch) {
        window.removeEventListener("mousemove", listener);
      }
      document.removeEventListener("scroll", scrollListener);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.parallaxContainer}
      style={
        {
          "--mouseRelPosX": mousePos[0] + "px",
          "--mouseRelPosY": mousePos[1] + "px",
        } as any
      }
    >
      <div className={styles.ship}></div>
    </div>
  );
}
