import {useLayoutEffect, useRef, useState} from "react";

import cn from "@edgedb-site/shared/utils/classNames";

import {CopyCode} from "@edgedb-site/shared/components/code";

import styles from "./terminal.module.scss";
import codeStyles from "@edgedb-site/shared/components/code/code.module.scss";

const useBrowserLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : () => {};

interface TerminalProps {
  code: string;
  className?: string;
  prompt?: string;
  header?: "macos" | "windows" | "none";
  lang?: "bash" | "powershell";
}

function lineWrap(str: string, maxWidth: number) {
  const tokens = str.split(" ");
  const lines: string[][] = [[]];

  let currentLineLength = -1;

  for (const token of tokens) {
    const lineLength = currentLineLength + token.length + 1;
    if (lineLength <= maxWidth) {
      lines[lines.length - 1].push(token);
      currentLineLength = lineLength;
    } else {
      lines.push([token]);
      currentLineLength = token.length;
    }
  }

  return lines.map(
    (tokens, i) => tokens.join(" ") + (i === lines.length - 1 ? "" : " ")
  );
}

export default function Terminal({
  code,
  className,
  prompt = "$",
  header = "macos",
  lang = "bash",
}: TerminalProps) {
  const codePromptRef = useRef<HTMLPreElement>(null);
  const codeBlockRef = useRef<HTMLPreElement>(null);

  const [codeBlockWidth, setCodeBlockWidth] = useState(Infinity);

  useBrowserLayoutEffect(() => {
    if (codePromptRef.current && codeBlockRef.current) {
      // @ts-ignore
      const observer = new ResizeObserver(() => {
        setCodeBlockWidth(
          Math.floor(
            codeBlockRef.current!.clientWidth /
              (codePromptRef.current!.clientWidth / prompt.length)
          )
        );
      });

      observer.observe(codeBlockRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [codePromptRef, codeBlockRef, code]);

  const lines =
    code.length < codeBlockWidth ? [code] : lineWrap(code, codeBlockWidth - 2);

  return (
    <div
      className={cn(styles.terminal, className, {
        [styles.windowsStyle]: header === "windows",
      })}
      data-theme="dark"
    >
      {header !== "none" ? <div className={styles.titleBar} /> : null}
      <div className={cn(codeStyles.code, styles.code)}>
        <div className={styles.codeWrapper}>
          <pre ref={codePromptRef} className={styles.prompt}>
            {prompt}
          </pre>
          <pre
            ref={codeBlockRef}
            className={cn(styles.codeBlock, {
              [styles.langPowershell]: lang === "powershell",
            })}
          >
            {lines.map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </pre>
          <CopyCode className={styles.copy} code={code} />
        </div>
      </div>
    </div>
  );
}
