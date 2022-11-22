import {useContext} from "react";

import docsVersionsConfig from "docVersions.config";

import {DocVersionContext} from "@/components/docs/contexts";

import styles from "./versionSwitcher.module.scss";

const versions = new Map(
  docsVersionsConfig.versions.map((version) => [version.id, version])
);

export default function VersionSwitcher() {
  const versionId = useContext(DocVersionContext);

  const version =
    versionId !== "dev"
      ? versions.get(versionId)!
      : {
          label: "dev",
          tag: null,
        };

  return (
    <div className={styles.versionSwitcher}>
      {version.label}
      {version.tag ? <span className={styles.tag}>{version.tag}</span> : null}
    </div>
  );
}
