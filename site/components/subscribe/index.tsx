import {SubscribeForm} from "@edgedb-site/shared/components/subscribe";

export {SubscribeForm};

import styles from "./subscribe.module.scss";
import {CloseIcon} from "../icons";

interface SubscribePopupProps {
  onClose: () => void;
}

export function SubscribePopup({onClose}: SubscribePopupProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closePopup} onClick={onClose}>
          <CloseIcon />
        </button>
        <h2>KEEP ME IN THE LOOP!</h2>
        <p>
          Subscribe to our mailing list to be the first to know about new blog
          posts and announcements.
        </p>
        <p>You can unsubscribe at any point.</p>
        <div className={styles.form}>
          <SubscribeForm styles={styles} inputPlaceholder="Enter your email" />
        </div>
      </div>
    </div>
  );
}
