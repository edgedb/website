import {useEffect} from "react";
import {createPortal} from "react-dom";

import dynamic from "next/dynamic";

import Spinner from "@edgedb/common/ui/spinner";

import {useOverlayActive} from "@edgedb-site/shared/hooks/useOverlayActive";
import {mediaQuery} from "@edgedb-site/shared/hooks/mediaQuery";

import {CloseIcon} from "@/components/icons";

import styles from "./blogExplainExample.module.scss";

import fallbackImage from "./fallback_image.png";

const BlogExplainPopup = dynamic(() => import("./popup"), {
  ssr: false,
  loading: () => <Spinner size={40} />,
});

export default function BlogExplainExample() {
  const [popupOpen, setPopupOpen] = useOverlayActive("blogExplainExample");

  useEffect(() => {
    if (popupOpen) {
      return mediaQuery("(max-width: 768px)", () => setPopupOpen(false));
    }
  }, [popupOpen]);

  return (
    <div className={styles.blogExplainExample}>
      <img
        className={styles.fallbackImage}
        src={fallbackImage.src}
        width={fallbackImage.width}
        height={fallbackImage.height}
      />
      <div
        className={styles.fullscreenButton}
        onClick={() => setPopupOpen(true)}
      >
        <FullscreenIcon />
      </div>

      {popupOpen
        ? createPortal(
            <div className={styles.popupOverlay}>
              <BlogExplainPopup />
              <div
                className={styles.closeButton}
                onClick={() => setPopupOpen(false)}
              >
                <CloseIcon />
              </div>
            </div>,
            document.getElementById("__blog_overlay_portal")!
          )
        : null}
    </div>
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
        fill="#808080"
      />
    </svg>
  );
}
