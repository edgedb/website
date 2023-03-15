import {useCallback, useEffect} from "react";
import {useSelector, useDispatch} from "react-redux";

import {runCells, resetAllCodeCells} from "tutorial/actions";
import {State} from "tutorial/types";

import {SchemaIcon, RunIcon, ResetIcon} from "./icons";
import {DocsMenuIcon} from "@/components/icons";
import {useSchemaViewContext} from "@/components/tutorial/schema";
import ControlBar from "@/components/tutorial/controlBar";

import {useTutorialTocContext} from "../toc";

import styles from "./tutorialControls.module.scss";

interface TutorialControlsProps {
  pagePath: string;
}

export default function TutorialControls({pagePath}: TutorialControlsProps) {
  const globalException = useSelector((state: State) => state.exception);

  const canResetAll = useSelector((state: State) =>
    state.pages.get(pagePath)!.cells.some((cellId) => {
      const cell = state.cells.get(cellId);
      return cell?.kind === "edgeql" && cell.text !== cell.initialText;
    })
  );

  const dispatch = useDispatch();

  const {setMenuOpen} = useTutorialTocContext();

  const {setViewOpen} = useSchemaViewContext();

  const runAll = useCallback(() => dispatch(runCells({pagePath})), [
    pagePath,
    dispatch,
  ]);

  useEffect(() => {
    const globalKeyListener = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        runAll();
      }
    };

    window.addEventListener("keydown", globalKeyListener, {capture: true});

    return () => {
      window.removeEventListener("keydown", globalKeyListener, {
        capture: true,
      });
    };
  }, [runAll]);

  return (
    <ControlBar
      errorMessage={
        globalException
          ? "Some error happened on server side, try to reload the page"
          : undefined
      }
      items={[
        {
          label: "Schema",
          icon: <SchemaIcon />,
          action: () => setViewOpen(true),
        },
        {label: "Run All", icon: <RunIcon />, action: runAll},
        {
          label: "Reset All",
          icon: <ResetIcon />,
          action: () => dispatch(resetAllCodeCells({pagePath})),
          disabled: !canResetAll,
        },
        {
          icon: <DocsMenuIcon />,
          action: () => setMenuOpen(true),
          style: styles.menuButton,
        },
      ]}
    />
  );
}
