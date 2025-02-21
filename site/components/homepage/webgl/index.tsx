import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {useBrowserLayoutEffect} from "@edgedb-site/shared/hooks/useBrowserLayoutEffect";
import cn from "@edgedb-site/shared/utils/classNames";
import {debounceToAnimationFrame} from "@edgedb-site/shared/utils/debounce";

import type {WebGlModelController} from "./webgl";

import styles from "./webgl.module.scss";

export const WebGlContext = createContext<{
  forceFallback: boolean;
  triggerFallback: () => void;
  setParticleColour: (colour: string) => void;
}>({} as any);

export default function WebGLWrapper({children}: PropsWithChildren<{}>) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [showParticles, setShowParticles] = useState(false);
  const [forceFallback, setForceFallback] = useState<boolean>(false);

  const [particles, setParticles] = useState<JSX.Element[] | null>(null);

  useBrowserLayoutEffect(() => {
    setParticles(
      getRandomPoints(80).map(([x, y], i) => {
        const size = 8 + Math.random() * 20;
        return (
          <div
            key={i}
            style={{
              width: size + "px",
              height: size + "px",
              margin: size / -2 + "px",
              top: x * 100 + "%",
              left: y * 100 + "%",
            }}
          ></div>
        );
      })
    );
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(max-width: 768px)").matches) {
      setShowParticles(true);
      const screenSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      const mouseOffset = {
        x: 0,
        y: 0,
      };

      const mouseListener = debounceToAnimationFrame((e: MouseEvent) => {
        mouseOffset.x = (e.clientX / screenSize.width) * 2 - 1;
        mouseOffset.y = (e.clientY / screenSize.height) * 2 - 1;

        wrapperRef.current?.style.setProperty(
          "--mouseOffsetX",
          mouseOffset.x.toString()
        );
        wrapperRef.current?.style.setProperty(
          "--mouseOffsetY",
          mouseOffset.y.toString()
        );
      });
      window.addEventListener("mousemove", mouseListener, {passive: true});

      const scrollListener = debounceToAnimationFrame(() => {
        wrapperRef.current?.style.setProperty(
          "--scrollOffset",
          document.documentElement.scrollTop.toString()
        );
      });
      window.addEventListener("scroll", scrollListener, {passive: true});

      return () => {
        window.removeEventListener("mousemove", mouseListener);
        window.removeEventListener("scroll", scrollListener);
      };
    }
  }, []);

  return (
    <WebGlContext.Provider
      value={{
        forceFallback,
        triggerFallback() {
          localStorage.setItem("useWebglFallback", "true");
          setForceFallback(true);
        },
        setParticleColour(colour: string) {
          wrapperRef.current?.style.setProperty(`--particleColour`, colour);
        },
      }}
    >
      <div
        ref={wrapperRef}
        className={cn(styles.webglWrapper, {
          [styles.hideParticles]: !showParticles,
        })}
      >
        <div className={styles.particles}>{particles}</div>
        <div className={cn(styles.particles, styles.particlesDark)}>
          {particles}
        </div>

        {children}
      </div>
    </WebGlContext.Provider>
  );
}

interface WebGLModelProps {
  modelId: string;
  className?: string;
  fallbackClassName?: string;
  stickyInner?: boolean;
}

export function WebGLModel({
  modelId,
  className,
  fallbackClassName,
  stickyInner,
}: WebGLModelProps) {
  const {forceFallback, triggerFallback} = useContext(WebGlContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const visible = useRef(false);

  useEffect(() => {
    if (
      !forceFallback &&
      !(
        window.matchMedia("(max-width: 1024px)").matches ||
        !!localStorage.getItem("useWebglFallback")
      )
    ) {
      let discarded = false;
      let controller: WebGlModelController | null = null;
      let intersectionObserver: IntersectionObserver | null = null;

      const pageVisibilityListener = () => {
        if (document.visibilityState === "hidden") {
          controller?.setVisibility(false);
        } else if (document.visibilityState === "visible") {
          controller?.setVisibility(visible.current);
        }
      };
      window.addEventListener("visibilitychange", pageVisibilityListener);

      import("./webgl").then(({WebGlModelController}) => {
        if (!discarded) {
          controller = new WebGlModelController(
            modelId,
            containerRef.current!.querySelector("canvas")!,
            () => {
              setLoaded(true);
            },
            () => {
              triggerFallback();
            },
            stickyInner ? containerRef.current! : undefined
          );

          intersectionObserver = new IntersectionObserver(
            (entries) => {
              visible.current = entries[0].isIntersecting;
              controller!.setVisibility(visible.current);
            },
            {rootMargin: "100px"}
          );
          intersectionObserver.observe(containerRef.current!);
        }
      });

      return () => {
        discarded = true;
        window.removeEventListener("visibilitychange", pageVisibilityListener);
        controller?.cleanup();
      };
    }
  }, [forceFallback]);

  return (
    <div
      ref={containerRef}
      className={cn(styles.model, className, {
        [fallbackClassName!]:
          !!fallbackClassName && !(loaded && !forceFallback),
        [styles.hideFallback]: loaded && !forceFallback,
      })}
    >
      {stickyInner ? (
        <div>
          <div>
            <canvas />
          </div>
        </div>
      ) : (
        <canvas />
      )}
    </div>
  );
}

function getRandomPoints(count: number) {
  const points: [number, number][] = [[Math.random(), Math.random()]];
  while (points.length < count) {
    const point: [number, number] = [Math.random(), Math.random()];
    let discard = false;
    for (const p of points) {
      const dx = point[0] - p[0];
      const dy = point[1] - p[1];
      if (dx * dx + dy * dy < 0.003) {
        discard = true;
        break;
      }
    }
    if (!discard) points.push(point);
  }
  return points;
}
