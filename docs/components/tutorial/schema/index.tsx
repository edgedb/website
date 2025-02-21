"use client";

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import dynamic from "next/dynamic";

import cn from "@edgedb-site/shared/utils/classNames";
import { useOverlayActive } from "@edgedb-site/shared/hooks/useOverlayActive";

import {
  prism,
  languages,
} from "@edgedb-site/shared/components/tutorial/codecell";
import ControlBar from "@/components/tutorial/controlBar";

import TutorialSchemaHelp from "@/components/tutorial/schemaHelp";

import { SchemaTextIcon, HelpIcon, CloseIcon } from "./icons";
import { SchemaIcon } from "@/components/tutorial/controls/icons";

import styles from "./schema.module.scss";

import schemaText from "@/build-cache/tutorial/schema-text.json";

const SchemaGraph = dynamic(
  () => import("@edgedb-site/shared/components/tutorial/schemaGraph"),
  {
    ssr: false,
  }
);

export default function Schema() {
  const { viewOpen, setViewOpen } = useSchemaViewContext();

  const [expanded, setExpanded] = useState(viewOpen);

  const [graphVisible, setGraphVisible] = useState(false);

  const [showTextSchema, setShowTextSchema] = useState(false);

  const [showHelp, setShowHelp] = useState(false);

  const highlightedSchemaText = useMemo(
    () => prism(schemaText, languages.sdl, "sdl"),
    [schemaText]
  );

  useEffect(() => {
    if (viewOpen) {
      setExpanded(true);
      setGraphVisible(false);
    }
  }, [viewOpen]);

  useEffect(() => {
    const helpViewed =
      localStorage.getItem("tutorialSchemaHelpViewed") === "true";
    if (!helpViewed) {
      setShowHelp(true);
      localStorage.setItem("tutorialSchemaHelpViewed", "true");
    }
  }, []);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setViewOpen(false);
      }
    };

    window.addEventListener("keydown", listener);

    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, []);

  if (!viewOpen && !expanded) {
    return null;
  }

  return (
    <div
      className={cn(styles.schema, {
        [styles.expanded]: viewOpen && expanded,
      })}
      onTransitionEnd={() => setExpanded(viewOpen)}
    >
      <ControlBar
        items={[
          {
            label: "Graph",
            icon: <SchemaIcon />,
            action: () => setShowTextSchema(false),
            active: showHelp === false && showTextSchema === false,
          },
          {
            label: "Text",
            icon: <SchemaTextIcon />,
            action: () => setShowTextSchema(true),
            active: showHelp === false && showTextSchema === true,
          },
          {
            label: "Help",
            icon: <HelpIcon />,
            action: () => setShowHelp(true),
            active: showHelp === true,
            hideOnMobile: true,
          },
          {
            label: "Close",
            icon: <CloseIcon />,
            action: () => setViewOpen(false),
          },
        ]}
      />

      <TutorialSchemaHelp open={showHelp} onClose={() => setShowHelp(false)} />

      {showTextSchema ? (
        <div className={styles.textSchema}>
          <pre dangerouslySetInnerHTML={{ __html: highlightedSchemaText }} />
        </div>
      ) : (
        <SchemaGraph
          onLoaded={() => setGraphVisible(true)}
          graphVisible={graphVisible}
        />
      )}
    </div>
  );
}

const SchemaViewContext = createContext({
  viewOpen: false,
  setViewOpen: (open: boolean) => {},
});

export function useSchemaViewContext() {
  return useContext(SchemaViewContext);
}

export function SchemaViewProvider({ children }: PropsWithChildren<{}>) {
  const [viewOpen, setViewOpen] = useOverlayActive("SchemaView");
  return (
    <SchemaViewContext.Provider value={{ viewOpen, setViewOpen }}>
      {children}
    </SchemaViewContext.Provider>
  );
}
