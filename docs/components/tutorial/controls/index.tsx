"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";

import { useOverlayActive } from "@edgedb-site/shared/hooks/useOverlayActive";

import { useTutorialPageState } from "@edgedb-site/shared/tutorial/state";

import { SchemaIcon, RunIcon, ResetIcon } from "./icons";
import { DocsMenuIcon } from "@/components/icons";
import { useSchemaViewContext } from "@/components/tutorial/schema";
import ControlBar from "@/components/tutorial/controlBar";

import styles from "./tutorialControls.module.scss";

export const TutorialControls = observer(function TutorialControls() {
  const pageState = useTutorialPageState();

  const [_, setMenuOpen] = useOverlayActive("SideNav");

  const { setViewOpen } = useSchemaViewContext();

  useEffect(() => {
    const globalKeyListener = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        pageState.run();
      }
    };

    window.addEventListener("keydown", globalKeyListener, { capture: true });

    return () => {
      window.removeEventListener("keydown", globalKeyListener, {
        capture: true,
      });
    };
  }, [pageState]);

  return (
    <ControlBar
      errorMessage={
        pageState.exception
          ? "Some error happened on server side, try to reload the page"
          : undefined
      }
      items={[
        {
          label: "Schema",
          icon: <SchemaIcon />,
          action: () => setViewOpen(true),
        },
        { label: "Run All", icon: <RunIcon />, action: () => pageState.run() },
        {
          label: "Reset All",
          icon: <ResetIcon />,
          action: () => pageState.resetAll(),
          disabled: !pageState.canResetAll,
        },
        {
          icon: <DocsMenuIcon />,
          action: () => setMenuOpen(true),
          style: styles.menuButton,
        },
      ]}
    />
  );
});
