import {useOverlayActive} from "@edgedb-site/shared/hooks/useOverlayActive";
import {CloseIconDefault, GitHubIcon} from "@/components/icons";
import getLoginUrl, {Tiers} from "@edgedb-site/shared/utils/getLoginUrl";
import styles from "./cloudModal.module.scss";

const CloudModal = () => {
  const [_, setModalOpen] = useOverlayActive("Cloud");

  const loginUrl = getLoginUrl(Tiers.pro);

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <button onClick={() => setModalOpen(false)} className={styles.close}>
          <CloseIconDefault />
        </button>
        <div className={styles.modal}>
          <h2>GET STARTED</h2>
          <div className={styles.content}>
            <ol>
              <li>
                Click the "Login" button below to authenticate with your GitHub
                account.
              </li>
              <li>
                After being redirected to cloud.edgedb.com, go ahead and create
                your new cloud instance.
              </li>
            </ol>
          </div>
          <a href={loginUrl} className={styles.submit}>
            <GitHubIcon /> Login with GitHub
          </a>
        </div>
      </div>
    </div>
  );
};

export default CloudModal;
