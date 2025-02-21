import {useEffect, useRef, useState} from "react";

import cn from "@edgedb-site/shared/utils/classNames";

import styles from "./imageGallery.module.scss";
import LazyImage from "@edgedb-site/shared/components/lazyImage";
import {useOverlayActive} from "@edgedb-site/shared/hooks/useOverlayActive";

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

  const isOneItemOnly = items.length === 1;

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
                    <div
                      className={cn(styles.caption, {
                        [styles.hide]: isOneItemOnly,
                      })}
                    >
                      {caption}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
          <div
            className={cn(styles.itemTabs, {
              [styles.oneTabOnly]: isOneItemOnly,
            })}
          >
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
                    [styles.active]: !isOneItemOnly && currentIndex === i,
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
        fill="currentColor"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
    >
      <g filter="url(#filter0_d_328_2398)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M14.9999 14.3966C15.0044 14.6583 14.9068 14.9215 14.7071 15.1212C14.5952 15.2331 14.4633 15.313 14.3229 15.3608C14.2215 15.3953 14.1129 15.4141 13.9999 15.4141H9.99986C9.44757 15.4141 8.99985 14.9663 8.99985 14.4141C8.99985 13.8618 9.44757 13.4141 9.99986 13.4141H11.5858L8.29289 10.1212C7.90237 9.73065 7.90237 9.09748 8.29289 8.70696C8.68342 8.31643 9.31659 8.31643 9.70712 8.70696L12.9999 11.9997L12.9999 10.4141C12.9999 9.86178 13.4476 9.41406 13.9999 9.41406C14.5522 9.41406 14.9999 9.86178 14.9999 10.4141L14.9999 14.3966ZM22.0001 15.4141C22.5524 15.4141 23.0001 14.9663 23.0001 14.4141C23.0001 13.8618 22.5524 13.4141 22.0001 13.4141H20.4142L23.707 10.1212C24.0976 9.73064 24.0976 9.09748 23.707 8.70696C23.3165 8.31643 22.6834 8.31643 22.2928 8.70696L19.0002 11.9997V10.4141C19.0002 9.86178 18.5525 9.41406 18.0002 9.41406C17.4479 9.41406 17.0002 9.86178 17.0002 10.4141L17.0002 14.3965C16.9956 14.6583 17.0932 14.9214 17.2929 15.1212C17.4051 15.2333 17.5372 15.3132 17.6778 15.361C17.779 15.3954 17.8874 15.4141 18.0002 15.4141H22.0001ZM23.707 24.1212C24.0976 23.7306 24.0976 23.0975 23.707 22.707L20.4141 19.4141L22.0001 19.4141C22.5524 19.4141 23.0001 18.9663 23.0001 18.4141C23.0001 17.8618 22.5524 17.4141 22.0001 17.4141L18.0001 17.4141L17.9897 17.4141C17.4422 17.4197 17.0001 17.8652 17.0001 18.4141L17 22.4141C17 22.9663 17.4478 23.4141 18.0001 23.4141C18.5523 23.4141 19.0001 22.9663 19.0001 22.4141V20.8284L22.2928 24.1212C22.6833 24.5117 23.3165 24.5117 23.707 24.1212ZM8.29289 24.1211C7.90237 23.7306 7.90237 23.0974 8.29289 22.7069L11.5858 19.4141H9.99986C9.44757 19.4141 8.99985 18.9664 8.99985 18.4141C8.99985 17.8618 9.44757 17.4141 9.99986 17.4141H13.9999C14.5522 17.4141 14.9999 17.8618 14.9999 18.4141L14.9998 18.4243L14.9998 22.414C14.9998 22.9663 14.5521 23.414 13.9998 23.414C13.4475 23.414 12.9998 22.9663 12.9998 22.414L12.9998 20.8284L9.70712 24.1211C9.31659 24.5116 8.68342 24.5116 8.29289 24.1211Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_328_2398"
          x="-4"
          y="-4"
          width="40"
          height="40"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_328_2398"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_328_2398"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}
