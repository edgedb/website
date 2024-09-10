import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import "mobx-react-lite/batchingForReactDom";

import cn from "@edgedb-site/shared/utils/classNames";

import {
  SchemaGraph,
  SchemaMinimap,
  schemaContext,
  useDebugState,
} from "@edgedb/schema-graph";
import { DBRouterProvider } from "@edgedb/studio/hooks/dbRoute";

import { schemaState, loadSchema } from "@edgedb-site/shared/tutorial/schema";

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
    <DBRouterProvider
      value={{
        currentPath: [],
        gotoInstancePage: () => {},
        locationKey: "",
        navigate: () => {},
        searchParams: new URLSearchParams(),
      }}
    >
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
    </DBRouterProvider>
  );
});

export function RecenterIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.2847 10.2859C12.6751 10.6755 13.3072 10.6755 13.6976 10.2859L17.0508 6.939C17.4418 6.54877 17.4421 5.91539 17.0515 5.52479C16.6612 5.13445 16.0283 5.13445 15.638 5.52478L13.9911 7.17166V1C13.9911 0.447715 13.5434 0 12.9911 0C12.4388 0 11.9911 0.447715 11.9911 0.999999V7.17149L10.3621 5.54247C9.97174 5.15213 9.33887 5.15213 8.94853 5.54247C8.55793 5.93307 8.55823 6.56646 8.94921 6.95669L12.2847 10.2859ZM7.17166 13.991H1C0.447715 13.991 0 13.5433 0 12.991C0 12.4387 0.447715 11.991 0.999999 11.991H7.17149L5.54281 10.3623C5.15228 9.97176 5.15229 9.33859 5.54281 8.94807C5.93333 8.55755 6.5665 8.55754 6.95702 8.94806L10.2929 12.2839C10.6834 12.6744 10.6834 13.3076 10.2929 13.6981L6.93933 17.0517C6.54881 17.4422 5.91564 17.4422 5.52512 17.0517C5.13459 16.6612 5.13459 16.028 5.52512 15.6375L7.17166 13.991ZM15.7071 12.2839C15.3166 12.6744 15.3166 13.3076 15.7071 13.6981L19.0607 17.0517C19.4512 17.4422 20.0844 17.4422 20.4749 17.0517C20.8654 16.6612 20.8654 16.028 20.4749 15.6375L18.8283 13.991H25C25.5523 13.991 26 13.5433 26 12.991C26 12.4387 25.5523 11.991 25 11.991H18.8285L20.4572 10.3623C20.8477 9.97176 20.8477 9.33859 20.4572 8.94807C20.0667 8.55755 19.4335 8.55754 19.043 8.94806L15.7071 12.2839ZM12.2834 15.7001C12.6741 15.3087 13.3083 15.3087 13.6989 15.7001L17.0532 19.0607C17.4431 19.4513 17.4424 20.0843 17.0522 20.4745C16.6616 20.8651 16.0281 20.8654 15.6376 20.4749L13.9911 18.8283V25C13.9911 25.5523 13.5434 26 12.9911 26C12.4388 26 11.9911 25.5523 11.9911 25V18.8285L10.3624 20.4572C9.97188 20.8477 9.33838 20.8474 8.94786 20.4569C8.5576 20.0666 8.55696 19.4336 8.94685 19.043L12.2834 15.7001Z"
      />
    </svg>
  );
}
