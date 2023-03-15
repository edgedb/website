import {useEffect, useState} from "react";
import {observer} from "mobx-react";
import "mobx-react-lite/batchingForReactDom";

import cn from "@/utils/classNames";

import {
  SchemaGraph,
  SchemaMinimap,
  schemaContext,
  useDebugState,
} from "@edgedb/schema-graph";

import {schemaState, loadSchema} from "tutorial/schema";

import {RecenterIcon} from "@/components/tutorial/schema/icons";

import styles from "./schemaGraph.module.scss";

function delay(time: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

interface SchemaProps {
  graphVisible: boolean;
  onLoaded: () => void;
}

export default observer(function Schema({
  graphVisible,
  onLoaded,
}: SchemaProps) {
  const debugState = useDebugState();

  const [sidepanelOpen, setSidepanelOpen] = useState(false);

  useEffect(() => {
    const setMobileZoom =
      !schemaState.isLoaded && window.matchMedia("(max-width: 768px)").matches;

    Promise.all([loadSchema(), delay(400)]).then(() => {
      if (setMobileZoom) {
        schemaState.graph.viewport.setZoomLevel(0.5);
      }
      onLoaded();
    });
  }, []);

  return (
    <schemaContext.Provider value={schemaState}>
      <div
        className={cn(styles.schemaGraph, {
          [styles.sidepanelOpen]: sidepanelOpen,
        })}
      >
        <SchemaGraph
          debug={debugState[0]}
          className={cn(styles.graph, {
            [styles.visible]: graphVisible,
          })}
        />

        <SchemaMinimap className={styles.minimap} />

        <div
          className={cn(styles.recenter, {
            [styles.show]: schemaState.graph.noNodesInVisibleBounds,
          })}
          onClick={() => schemaState.graph.resetViewportPosition(true)}
        >
          <RecenterIcon />
          Re-center
        </div>
      </div>
    </schemaContext.Provider>
  );
});
