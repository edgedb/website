import {
  createContext,
  useRef,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

import cn from "@/utils/classNames";

import styles from "./backgroundFader.module.scss";

import {WebGlContext} from "../webgl";

type Colour = [number, number, number];

const BgFaderContext = createContext<{
  addBlock: (
    element: HTMLElement,
    colour: Colour,
    particleColour: Colour | null
  ) => () => void;
}>({} as any);

interface BackgroundBlockProps {
  colour: string;
  particleColour?: string;
  className?: string;
}

export function BackgroundBlock({
  colour,
  particleColour,
  className,
  children,
  ...props
}: PropsWithChildren<BackgroundBlockProps>) {
  const bgContext = useContext(BgFaderContext);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const bgDisposer = bgContext.addBlock(
        ref.current,
        [
          parseInt(colour.slice(0, 2), 16),
          parseInt(colour.slice(2, 4), 16),
          parseInt(colour.slice(4, 6), 16),
        ],
        particleColour
          ? [
              parseInt(particleColour.slice(0, 2), 16),
              parseInt(particleColour.slice(2, 4), 16),
              parseInt(particleColour.slice(4, 6), 16),
            ]
          : null
      );

      return () => {
        bgDisposer();
      };
    }
  }, [bgContext, colour]);

  return (
    <div
      {...props}
      ref={ref}
      className={cn(styles.backgroundBlock, className)}
    >
      {children}
    </div>
  );
}

interface BackgroundFaderProps {
  usePageBackground?: boolean;
  className?: string;
}

export function BackgroundFader({
  usePageBackground,
  className,
  children,
  ...props
}: PropsWithChildren<BackgroundFaderProps>) {
  const webglContext = useContext(WebGlContext);

  const ref = useRef<HTMLDivElement>(null);
  const [blocks] = useState<
    Map<
      Element,
      {colour: Colour; particleColour: Colour | null; ratio: number}
    >
  >(new Map());
  const [observer] = useState<IntersectionObserver | null>(() =>
    typeof window !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const block = blocks.get(entry.target);
              if (block) {
                block.ratio =
                  entry.intersectionRect.height / entry.rootBounds!.height;
              }
            }
            const blockData = [...blocks.values()];
            const totalRatio = blockData.reduce(
              (sum, data) => [
                sum[0] + data.ratio,
                sum[1] + (data.particleColour ? data.ratio : 0),
              ],
              [0, 0]
            );
            let r = 0,
              g = 0,
              b = 0,
              pr = 0,
              pg = 0,
              pb = 0;
            for (let {colour, particleColour, ratio} of blockData) {
              if (ratio) {
                const bRatio = ratio / totalRatio[0];
                r += colour[0] * bRatio;
                g += colour[1] * bRatio;
                b += colour[2] * bRatio;

                if (particleColour && totalRatio[1]) {
                  const pRatio = ratio / totalRatio[1];
                  pr += particleColour[0] * pRatio;
                  pg += particleColour[1] * pRatio;
                  pb += particleColour[2] * pRatio;
                }
              }
            }
            if (r || g || b) {
              const backgroundColour = `rgba(${r}, ${g}, ${b})`;
              if (usePageBackground) {
                document.body.style.backgroundColor = backgroundColour;
              } else if (ref.current) {
                ref.current.style.backgroundColor = backgroundColour;
              }
            }
            if (pr || pg || pb) {
              webglContext.setParticleColour(
                `rgb(${Math.round(pr)}, ${Math.round(pg)}, ${Math.round(pb)})`
              );
            }
          },
          {
            threshold: Array(101)
              .fill(0)
              .map((_, i) => i / 100),
          }
        )
      : null
  );

  return (
    <BgFaderContext.Provider
      value={{
        addBlock: (
          element: HTMLElement,
          colour: Colour,
          particleColour: Colour | null
        ) => {
          blocks.set(element, {colour, particleColour, ratio: 0});
          observer?.observe(element);

          return () => {
            observer?.unobserve(element);
            blocks.delete(element);
          };
        },
      }}
    >
      <div
        ref={ref}
        className={cn(styles.backgroundFader, className)}
        {...props}
      >
        {children}
      </div>
    </BgFaderContext.Provider>
  );
}
