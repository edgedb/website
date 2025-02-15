import {debounceToAnimationFrame} from "@edgedb-site/shared/utils/debounce";
import Head from "next/head";
import {useEffect, useRef, useState} from "react";
import ExpandingArrow from "@edgedb-site/shared/components/expandingArrow";
import Spacer from "../spacer";
import styles from "./edgedbV2Hero.module.scss";

export default function EdgeDBDayV2() {
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
          <h2>
            EdgeDB 2.0
            <br />
            is approaching.
          </h2>
          <p>
            The world's favorite graph-relational database is back for an
            action-packed sequel. Tune in for a series of lightning talks
            breaking down what's new and what's next for EdgeDB.
          </p>
          <div className={styles.emojiRow}>
            <p>🚀 EdgeDB 2.0 Day</p>
            <p>📅 July 28th, 2022, 10am PT</p>
            <p>
              📍{"  "}
              <a href={"https://lu.ma/edgedb"} rel="noopener noreferrer">
                https://lu.ma/edgedb
              </a>
            </p>
          </div>
          <div className={styles.registerRow}>
            <a
              href="https://lu.ma/event/evt-wHBOVOeP36IHQcM"
              className={styles.register}
              data-luma-action="checkout"
              data-luma-event-id="evt-wHBOVOeP36IHQcM"
            >
              <span>Grab a ticket</span>
              <ExpandingArrow
                className={styles.expandingArrow}
                strokeWidth={2}
                height={10}
                width={18}
                expandBy={8}
              />
            </a>
            <Spacer w="20px" />
            <a className={styles.scheduleLink} href="https://lu.ma/edgedb">
              View itinerary
            </a>
          </div>
        </div>
        <Spacer flex="45px" />
        <div className={styles.spacerColumn}></div>
        {/* <div className={styles.scheduleColumn}>
          <ScheduleRow time={"10:00am"} title={"Introducing EdgeDB 2.0"} />
          <ScheduleRow
            time={"10:15am"}
            title={"Pretty, powerful: A demo of EdgeDB UI"}
          />
          <ScheduleRow
            time={"10:30am"}
            title={"Access control with object-level security"}
          />
          <ScheduleRow
            time={"10:45am"}
            title={"Getting analytical: introducing GROUP"}
          />
          <ScheduleRow time={"11:00am"} title={"The future of EdgeDB"} />
        </div> */}
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
