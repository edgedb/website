"use client";

import { useState, useCallback } from "react";
import Editor from "react-simple-code-editor";

import { highlight as prism, languages } from "prismjs";
import "@edgedb-site/shared/components/code/auto-grammars";

import { observer } from "mobx-react";

import Inspector from "@edgedb/inspector";

import cn from "@edgedb-site/shared/utils/classNames";

import {
  CellResult,
  CellResultError,
} from "@edgedb-site/shared/tutorial/types";

import { useTheme, ColourTheme } from "@edgedb-site/shared/hooks/useTheme";

import styles from "./codecell.module.scss";
import {
  TutorialCellState,
  useTutorialPageState,
} from "@edgedb-site/shared/tutorial/state";

export { prism, languages };

const STATUSES_WITH_OUTPUT = new Set([
  "SELECT",
  "INSERT",
  "DELETE",
  "UPDATE",
  "GET MIGRATION",
  "DESCRIBE",
]);

// https://github.com/edgedb/edgedb/blob/master/edb/errors/base.py
enum ErrorField {
  hint = 0x0001,
  details = 0x0002,
  positionStart = 0xfff1,
  positionEnd = 0xfff2,
  lineStart = 0xfff3,
  columnStart = 0xfff4,
  utf16ColumnStart = 0xfff5,
  lineEnd = 0xfff6,
  columnEnd = 0xfff7,
  utf16ColumnEnd = 0xfff8,
  characterStart = 0xfff9,
  characterEnd = 0xfffa,
}

function decodeErrorLocation(
  { error }: CellResultError,
  fields: ErrorField[],
  mode: "binary" | "json"
) {
  function parseNum(num: string) {
    const int = parseInt(num, 10);
    return Number.isNaN(int) ? null : int;
  }

  return fields.map((field) => {
    const num = parseNum(error[2][field]);
    return num !== null &&
      mode === "json" &&
      [ErrorField.lineStart, ErrorField.lineEnd].includes(field)
      ? num - 1
      : num;
  });
}

interface CodeCellProps {
  cellId: number;
  className?: string;
  inlineCellHeaders?: boolean;
}

export const CodeCell = observer(function CodeCell({
  cellId,
  className,
  inlineCellHeaders,
}: CodeCellProps) {
  const [focused, setFocused] = useState(false);
  const highlighter = useCallback(
    (code: string) => prism(code, languages.edgeql, "edgeql"),
    []
  );

  const pageState = useTutorialPageState();

  const { cell, result, errorInCell } = pageState.getCellState(cellId);

  let errorOverlay: JSX.Element | null = null;
  if (!cell.resultOutdated && result?.kind === "error") {
    let [lineStart, lineEnd, colStart, colEnd] = decodeErrorLocation(
      result,
      [
        ErrorField.lineStart,
        ErrorField.lineEnd,
        ErrorField.utf16ColumnStart,
        ErrorField.utf16ColumnEnd,
      ],
      result.mode
    );
    if (
      lineStart !== null &&
      lineEnd !== null &&
      colStart !== null &&
      colEnd !== null
    ) {
      const lines = cell.query.split("\n");
      const errorSpan =
        lineStart === lineEnd
          ? lines[lineStart - 1].slice(colStart, colEnd)
          : lines[lineStart - 1].slice(colStart) +
            lines.slice(lineStart, lineEnd - 1).join("\n") +
            lines[lineEnd - 1].slice(0, colEnd);
      errorOverlay = (
        <pre className={styles.errorOverlay}>
          {[
            ...lines.slice(0, lineStart - 1),
            lines[lineStart - 1].slice(0, colStart),
          ].join("\n")}
          <span>{errorSpan}</span>
          {[lines[lineEnd - 1].slice(colEnd), ...lines.slice(lineEnd)].join(
            "\n"
          )}
        </pre>
      );
    }
  }

  return (
    <div
      className={cn(className, {
        [styles.inlineCellHeaders]: !!inlineCellHeaders,
      })}
      id={`codecell${cellId}`}
    >
      <div
        className={cn(styles.cell, styles.code, {
          [styles.focused]: focused,
          [styles.edited]: cell.isEdited,
        })}
      >
        <div className={styles.indicator} />

        <div className={styles.cellBorder}>
          <div className={styles.upperBorder}>
            <div className={styles.cellType}>
              Input
              <span className={styles.counter} />
            </div>
          </div>
          <div className={styles.lowerBorder}>
            <div className={styles.controls}>
              <div className={styles.run} onClick={() => pageState.run(cell)}>
                <span>
                  <RunIcon />
                  Run
                </span>
              </div>
              {cell.isEdited ? (
                <div className={styles.reset} onClick={() => cell.resetQuery()}>
                  <span>
                    <ResetIcon />
                    Reset
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className={cn(styles.inner, styles.codeInner)}>
          <Editor
            className={styles.textEditor}
            value={cell.query}
            onValueChange={(val) => cell.setQuery(val)}
            highlight={highlighter}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
          />
          {errorOverlay}
        </div>
      </div>

      <CodeCellOutput cell={cell} result={result} errorInCell={errorInCell} />
    </div>
  );
});

const CodeCellOutput = observer(function CodeCellOutput({
  cell,
  result,
  errorInCell,
}: {
  cell: TutorialCellState;
  result: CellResult | null;
  errorInCell: number | null;
}) {
  const pageState = useTutorialPageState();

  const { actualTheme } = useTheme();

  let dataStatus: JSX.Element | null = null;
  let dataInspector: JSX.Element | null = null;
  if (result && result.kind === "data") {
    if (STATUSES_WITH_OUTPUT.has(result.status)) {
      dataInspector = (
        <Inspector
          state={result.state}
          key={result.id}
          rowHeight={28}
          disableVirtualisedRendering
        />
      );
    } else {
      dataStatus = <div className={styles.dataStatus}>{result.status}: OK</div>;
    }
  }

  const toggleMode = () => {
    cell.setMode(cell.mode === "json" ? "binary" : "json");
    if (dataInspector) {
      pageState.run(cell);
    }
  };

  let dataError: JSX.Element | null = null;
  if (result && result.kind === "error") {
    const details = result.error[2][ErrorField.details];
    const hint = result.error[2][ErrorField.hint];
    dataError = (
      <div>
        <b>{result.error[0]}</b>: {result.error[1]}
        {details ? (
          <div className={styles.errorHint}>
            <b>Details</b>: {details}
          </div>
        ) : null}
        {hint ? (
          <div className={styles.errorHint}>
            <b>Hint</b>: {hint}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(styles.cell, {
        [styles.error]: !!dataError,
        [styles.inspector]: !!dataInspector,
        [styles.outdated]: cell.resultOutdated,
        "dark-theme": actualTheme === ColourTheme.Dark,
      })}
    >
      <div className={styles.cellBorder}>
        <div className={styles.upperBorder}>
          <div className={styles.cellType}>
            <span className={styles.cellTypeStatus}>
              Output
              <span className={styles.counter} />
            </span>{" "}
            <span className={styles.modeToggle} onClick={toggleMode}>
              {cell.mode === "json" ? "JSON" : "Objects"}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.inner}>
        {dataInspector ?? dataStatus ?? dataError ?? (
          <div className={styles.unevaled}>
            {errorInCell !== null ? (
              <>
                {`An error occurred in cell ${errorInCell + 1}`}
                <a href={`#codecell${errorInCell}`}>Go to cell</a>
              </>
            ) : (
              `Press the 'Run' button to evaluate the input`
            )}
          </div>
        )}
      </div>
    </div>
  );
});

function RunIcon() {
  return (
    <svg
      width="7"
      height="8"
      viewBox="0 0 7 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.954545 7.91257L6.68182 4.55894C7.10606 4.31052 7.10606 3.68948 6.68182 3.44106L0.954546 0.087431C0.530303 -0.160986 6.06884e-07 0.149535 6.06884e-07 0.646369L0 7.35363C0 7.85046 0.530303 8.16099 0.954545 7.91257Z"
      />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      width="11"
      height="10"
      viewBox="0 0 11 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.49406 8.54015C8.56181 9.48905 7.34271 10 5.98019 10C5.54992 10 5.26308 9.70803 5.26308 9.27007C5.26308 8.83212 5.54992 8.54015 5.98019 8.54015C6.91244 8.54015 7.77298 8.17518 8.41838 7.51825C9.06379 6.86131 9.42235 5.9854 9.42235 5.0365C9.42235 4.08759 9.06379 3.21168 8.41838 2.55474C7.77298 1.89781 6.91244 1.53285 5.98019 1.53285C5.04794 1.53285 4.1874 1.75183 3.542 2.48175C2.96831 3.06569 2.68146 3.79562 2.53804 4.59854H3.47029C3.61371 4.59854 3.68542 4.74453 3.61371 4.81752L1.96434 7.73723C1.89263 7.81022 1.74921 7.81022 1.6775 7.73723L0.0281328 4.81752C-0.0435788 4.74453 0.0281328 4.59854 0.171556 4.59854H1.10381C1.17552 3.43066 1.6775 2.33577 2.53804 1.45985C3.47029 0.510949 4.68938 0 6.0519 0C7.41442 0 8.63352 0.510949 9.56577 1.45985C10.498 2.40876 11 3.64964 11 5.0365C10.9283 6.27737 10.4263 7.59124 9.49406 8.54015Z"
      />
    </svg>
  );
}
