import {useEffect, useRef, useState} from "react";

import cn from "@edgedb-site/shared/utils/classNames";

import styles from "./imageGallery.module.scss";
import LazyImage from "@edgedb-site/shared/components/lazyImage";
import {useOverlayActive} from "@edgedb-site/shared/hooks/useOverlayActive";
import {CloseIcon} from "../icons";

interface ImageGalleryProps {
  items: ({
    title: JSX.Element;
    caption: JSX.Element | null;
    aspectRatio: number;
  } & (
    | {type: "image"; data: {url: string; thumbnail?: string; alt?: string}}
    | {type: "youtube"; data: {videoId: string}}
  ))[];
  aspectRatio: number;
}

let galleryIdCounter = 0;
export default function ImageGallery({
  items,
  aspectRatio: galleryAspect,
}: ImageGalleryProps) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [galleryId] = useState(() => galleryIdCounter++);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  const [fullscreenActive, _setFullscreenActive] = useOverlayActive(
    `gallery${galleryId}`
  );
  const [fullscreenOpening, setFullscreenOpening] = useState(false);

  const setFullscreenActive = (active: boolean) => {
    if (active) {
      setPlaceholderHeight(galleryRef.current!.clientHeight);
      setFullscreenOpening(true);
    }
    _setFullscreenActive(active);
  };

  useEffect(() => {
    if (fullscreenOpening) {
      setFullscreenOpening(false);
    }
  }, [fullscreenOpening]);

  useEffect(() => {
    const tabsNode = tabsRef.current;
    if (tabsNode) {
      const rect = tabsNode.getBoundingClientRect();
      const tabRect = tabsNode.children[currentIndex].getBoundingClientRect();
      tabsNode.scrollTo({
        left:
          tabsNode.scrollLeft +
          tabRect.left +
          tabRect.width / 2 -
          (rect.left + rect.width / 2),
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  return (
    <>
      <div
        className={cn(styles.fullscreenWrapper, {
          [styles.isFullscreen]: fullscreenActive,
          [styles.fullscreenOpening]: fullscreenOpening,
        })}
      >
        <div
          ref={galleryRef}
          className={styles.imageGallery}
          style={
            {
              "--galleryAspect": galleryAspect,
              "--itemCount": items.length,
            } as any
          }
        >
          <div className={styles.images}>
            <div
              className={styles.scrollWrapper}
              style={{
                transform: `translateX(${
                  (currentIndex * -100) / items.length
                }%)`,
              }}
            >
              {items.map(
                ({type, data, caption, aspectRatio: imageAspect}, i) => (
                  <div
                    key={i}
                    className={cn(styles.image, {
                      [styles.active]: currentIndex === i,
                    })}
                    style={{"--imageAspect": imageAspect} as any}
                  >
                    {type === "image" ? (
                      <LazyImage
                        url={data.url}
                        alt={data.alt}
                        thumbnail={data.thumbnail}
                        width={1440}
                        height={1440 / imageAspect}
                        widths={[940, 1440]}
                        sizes={{default: 1440, md: 940}}
                      />
                    ) : (
                      <div className={styles.youtubeEmbed}>
                        <iframe
                          src={`https://www.youtube.com/embed/${data.videoId}`}
                          frameBorder={0}
                          allowFullScreen
                          // @ts-ignore
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className={styles.caption}>{caption}</div>
                  </div>
                )
              )}
            </div>
          </div>
          <div className={styles.itemTabs}>
            <div
              className={cn(styles.prevImage, {
                [styles.disabled]: currentIndex === 0,
              })}
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(currentIndex - 1);
                }
              }}
            >
              <ArrowIcon />
            </div>
            <div ref={tabsRef} className={styles.itemTabsScrollWrapper}>
              {items.map((item, i) => (
                <div
                  key={i}
                  className={cn(styles.itemTab, {
                    [styles.active]: currentIndex === i,
                  })}
                  onClick={() => setCurrentIndex(i)}
                >
                  {item.title}
                </div>
              ))}
            </div>
            <div
              className={cn(styles.nextImage, {
                [styles.disabled]: currentIndex === items.length - 1,
              })}
              onClick={() => {
                if (currentIndex < items.length - 1) {
                  setCurrentIndex(currentIndex + 1);
                }
              }}
            >
              <ArrowIcon />
            </div>
            <div
              className={styles.fullscreenIcon}
              onClick={() => setFullscreenActive(true)}
            >
              <FullscreenIcon />
            </div>
          </div>
        </div>
        {fullscreenActive ? (
          <div
            className={styles.closeFullscreen}
            onClick={() => setFullscreenActive(false)}
          >
            <CloseIcon />
          </div>
        ) : null}
      </div>
      {fullscreenActive ? (
        <div
          className={styles.placeholder}
          style={{height: placeholderHeight}}
        />
      ) : null}
    </>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="22"
      height="36"
      viewBox="0 0 22 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.41421 2.58579C4.63316 1.80474 3.36683 1.80474 2.58578 2.58579C1.80474 3.36684 1.80474 4.63317 2.58578 5.41421L15.1716 18L2.58578 30.5858C1.80474 31.3668 1.80473 32.6332 2.58578 33.4142C3.36683 34.1953 4.63316 34.1953 5.41421 33.4142L19.4142 19.4142C20.1953 18.6332 20.1953 17.3668 19.4142 16.5858L5.41421 2.58579Z"
      />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="-1 -1 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.000150988 1.43149C-0.00438305 1.16979 0.0931982 0.906653 0.292895 0.706957C0.404855 0.594997 0.536759 0.515135 0.67717 0.467371C0.778493 0.432812 0.887135 0.414062 1.00016 0.414062H5.00017C5.55246 0.414062 6.00018 0.861778 6.00018 1.41406C6.00018 1.96635 5.55246 2.41406 5.00017 2.41406L3.41423 2.41406L6.70714 5.70695C7.09766 6.09748 7.09766 6.73064 6.70714 7.12117C6.31661 7.51169 5.68344 7.51169 5.29292 7.12117L2.00016 3.82843L2.00016 5.41406C2.00016 5.96635 1.55244 6.41406 1.00015 6.41406C0.447867 6.41406 0.000149476 5.96635 0.000149645 5.41406L0.000150988 1.43149ZM10.9998 0.414062C10.4476 0.414062 9.99985 0.861778 9.99985 1.41406C9.99985 1.96635 10.4476 2.41406 10.9998 2.41406L12.5858 2.41406L9.29294 5.70695C8.90242 6.09748 8.90242 6.73064 9.29294 7.12117C9.68346 7.51169 10.3166 7.51169 10.7071 7.12117L13.9998 3.82843V5.41406C13.9998 5.96635 14.4475 6.41406 14.9998 6.41406C15.5521 6.41406 15.9998 5.96635 15.9998 5.41406L15.9998 1.43158C16.0043 1.16985 15.9068 0.906673 15.707 0.706956C15.5949 0.594835 15.4628 0.514904 15.3222 0.467164C15.221 0.432737 15.1126 0.414062 14.9998 0.414062H10.9998ZM9.29294 9.70696C8.90242 10.0975 8.90242 10.7306 9.29294 11.1212L12.5859 14.4141L10.9999 14.4141C10.4476 14.4141 9.9999 14.8618 9.9999 15.4141C9.9999 15.9663 10.4476 16.4141 10.9999 16.4141L14.9999 16.4141L15.0103 16.414C15.5578 16.4085 15.9999 15.9629 15.9999 15.4141L15.9999 11.4141C15.9999 10.8618 15.5522 10.4141 14.9999 10.4141C14.4476 10.4141 13.9999 10.8618 13.9999 11.4141V12.9997L10.7072 9.70696C10.3166 9.31643 9.68347 9.31643 9.29294 9.70696ZM6.70699 9.70696C7.09752 10.0975 7.09752 10.7306 6.70699 11.1212L3.41413 14.414H5.00003C5.55231 14.414 6.00003 14.8617 6.00003 15.414C6.00003 15.9663 5.55231 16.414 5.00003 16.414H1.00001C0.447718 16.414 0 15.9663 0 15.414L5.09866e-05 15.4038L4.96413e-05 11.4141C4.94727e-05 10.8618 0.447767 10.4141 1.00005 10.4141C1.55234 10.4141 2.00006 10.8618 2.00006 11.4141L2.00006 12.9996L5.29277 9.70696C5.6833 9.31643 6.31646 9.31643 6.70699 9.70696Z"
      />
    </svg>
  );
}
