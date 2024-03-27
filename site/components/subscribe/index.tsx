import {SubscribeForm} from "@edgedb-site/shared/components/subscribe";

export {SubscribeForm};

import styles from "./subscribe.module.scss";

interface SubscribePopupProps {
  onClose: () => void;
}

export function SubscribePopup({onClose}: SubscribePopupProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          Keep me in the loop!
          <PopupCloseIcon className={styles.closePopup} onClick={onClose} />
        </div>
        <div className={styles.content}>
          <p>
            Subscribe to our mailing list to be the first to know about new
            blog posts and announcements.
          </p>
          <p>You can unsubscribe at any point.</p>

          <div className={styles.form}>
            <SubscribeForm
              styles={styles}
              inputPlaceholder="Enter your email"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PopupCloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.5793 22.1284L22.3342 19.3643L8.55941 5.54405L5.80444 8.30811L19.5793 22.1284Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.3342 8.30853L8.55941 22.1288L5.80444 19.3647L19.5793 5.54448L22.3342 8.30853Z"
        fill="white"
      />
    </svg>
  );
}
