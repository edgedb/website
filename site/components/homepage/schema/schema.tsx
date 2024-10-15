import {useState} from "react";
import dynamic from "next/dynamic";

import {useOverlayActive} from "@edgedb-site/shared/hooks/useOverlayActive";

import styles from "./schema.module.scss";

import {Code} from "@edgedb-site/shared/components/code";
import {CloseIcon, FullScreenIcon} from "@/components/icons";

import schemaText from "@/build-cache/tutorial/schema-text.json";

const SchemaGraph = dynamic(
  () => import("@edgedb-site/shared/components/tutorial/schemaGraph"),
  {
    ssr: false,
  }
);

export default function SchemaViewer() {
  const [overlayOpen, setOverlayOpen] = useOverlayActive("HomepageSchemaView");

  const [graphVisible, setGraphVisible] = useState(false);

  return (
    <div className={styles.schemaViewer}>
      <div className={styles.schemaText}>
        <Code language="sdl" code={schemaText} noCopy />
      </div>
      <div className={styles.schemaGraph}>
        <div
          className={styles.fullscreenButton}
          onClick={() => setOverlayOpen(true)}
        >
          <span>Interactive Schema</span>
          <FullScreenIcon />
        </div>
      </div>
      {overlayOpen ? (
        <div className={styles.fullscreenGraph}>
          <SchemaGraph
            onLoaded={() => setGraphVisible(true)}
            graphVisible={graphVisible}
          />
          <div
            className={styles.fullscreenClose}
            onClick={() => setOverlayOpen(false)}
          >
            <CloseIcon />
          </div>
        </div>
      ) : null}
    </div>
  );
}
