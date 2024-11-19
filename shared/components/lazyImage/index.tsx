"use client";

import { useState, useRef, useEffect } from "react";

import cn from "../../utils/classNames";
import { useTheme, ColourTheme } from "../../hooks/useTheme";
import styles from "./lazyImage.module.scss";

const sizesMap = {
  xs: "320px",
  sm: "768px",
  md: "1024px",
  lg: "1440px",
  xl: "1920px",
};

type sizeKeys = "default" | keyof typeof sizesMap;

export interface LazyImageProps {
  className?: string;
  url: string;
  alt?: string;
  width: number;
  height: number;
  thumbnail?: string;
  widths?: number[];
  sizes?:
    | string
    | {
        [size in sizeKeys]?: string | number;
      };
  darkUrl?: string;
}

export default function LazyImage(props: LazyImageProps) {
  return <_LazyImage key={props.url} {...props} />;
}

function _LazyImage({
  url,
  alt,
  width,
  height,
  thumbnail,
  widths,
  sizes,
  className,
  darkUrl,
}: LazyImageProps) {
  const [isLoaded, setLoaded] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const { actualTheme } = useTheme();

  const themeUrl = darkUrl && actualTheme === ColourTheme.Dark ? darkUrl : url;

  const ext = (themeUrl.match(/\.\w{1,4}$/) ?? [])[0];

  const hasExt = ext != null;
  const isVideo = ext === ".mp4";

  const sortedWidths =
    (widths && !hasExt && [...widths].sort((a, b) => b - a)) || undefined;

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
      return;
    }

    timerRef.current = setTimeout(() => setShowTransition(true), 100);

    return () => {
      clearTimeout(timerRef.current!);
    };
  }, []);

  return (
    <div className={cn(styles.wrapper, className)} ref={wrapperRef}>
      {isVideo ? (
        <_LazyVideo
          src={themeUrl}
          width={width}
          height={height}
          onLoad={() => {
            clearTimeout(timerRef.current!);
            setLoaded(true);
          }}
        />
      ) : (
        <img
          ref={imgRef}
          src={
            themeUrl +
            (sortedWidths ? `-${sortedWidths[0]}` : "") +
            (hasExt ? "" : ".webp")
          }
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          srcSet={sortedWidths && generateSrcSet(themeUrl, sortedWidths)}
          sizes={
            sortedWidths &&
            sizes &&
            (typeof sizes === "string" ? sizes : mapSizes(sizes))
          }
          onLoad={() => {
            clearTimeout(timerRef.current!);
            setLoaded(true);
          }}
        />
      )}
      {thumbnail ? (
        <div
          className={cn(styles.placeholder, {
            [styles.loaded]: isLoaded,
            [styles.transition]: showTransition,
          })}
          style={{
            backgroundImage: `url(${thumbnail})`,
          }}
        />
      ) : null}
    </div>
  );
}

function _LazyVideo({
  src,
  width,
  height,
  onLoad,
}: {
  src: string;
  width: number;
  height: number;
  onLoad: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          target.play();
        } else {
          target.pause();
        }
      }
    });

    observer.observe(ref.current!);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      width={width}
      height={height}
      controls={false}
      loop
      muted
      playsInline
      preload="none"
      onCanPlay={onLoad}
    />
  );
}

function generateSrcSet(url: string, widths: number[]) {
  return widths
    .flatMap((width) => [
      `${url}-${width}.webp ${width}w`,
      `${url}-${width}-2x.webp ${width * 2}w`,
    ])
    .join(", ");
}

function mapSizes(sizes: {
  [size in sizeKeys]?: string | number;
}): string {
  const parts = (["xl", "lg", "md", "sm", "xs"] as (keyof typeof sizesMap)[])
    .map((sizeKey) => {
      const size = sizes[sizeKey];
      return size
        ? `(max-width: ${sizesMap[sizeKey]}) ${
            typeof size === "number" ? size + "px" : size
          }`
        : undefined;
    })
    .filter((part) => !!part) as string[];

  parts.push(
    sizes.default
      ? typeof sizes.default === "number"
        ? sizes.default + "px"
        : sizes.default
      : "100vw"
  );

  return parts.join(", ");
}
