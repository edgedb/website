import React, {useRef, useState} from "react";

import cn from "@/utils/classNames";
import {CopyIcon, CodeExpandIcon} from "@/components/icons";
import {useIsOverlayActive} from "hooks/useOverlayActive";
import {useDocVersion} from "@/components/docs/docVersionContext";

import Prism from "prismjs";
import styles from "./code.module.scss";

let isLoaded = false;
function loadGrammars() {
  if (!isLoaded) {
    require("./loadGrammars");
    isLoaded = true;
  }
}
loadGrammars();

export {Prism};

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface Section {
  type: "normal" | "new" | "changed";
  str: string;
}

function extractSections(str: string): Section[] {
  const res: Section[] = [{type: "normal", str: ""}];

  const push = (s: string) => (res[res.length - 1].str += s);
  const section = () => res[res.length - 1].type;

  for (let line of str.split(/\n/g)) {
    let m = line.match(/^\s*#\s*<(\/?)(\w+)>\s*$/);
    if (m) {
      if (m[1] === "/") {
        if (section() !== m[2]) {
          console.error(
            "closing #</" +
              m[2] +
              "> code section does not match " +
              "opening #<" +
              section() +
              ">"
          );
        }
        // close section
        res.push({
          type: "normal",
          str: "",
        });
      } else {
        // new section
        if (section() !== "normal") {
          console.error("nested #</" + m[2] + "> are not supported");
        }
        if (!["new", "changed"].includes(m[2])) {
          console.error(
            `unsupported code section name <${m[2]}>; ` +
              `expected <new> or <changed>`
          );
        }
        res.push({
          type: m[2] as Section["type"],
          str: "",
        });
      }
    } else {
      push(line + "\n");
    }
  }

  res[res.length - 1].str = res[res.length - 1].str.replace(/\n$/, "");

  return res;
}

interface ReplSection {
  promptLines: string[];
  queryLines: string[];
  outLines: string[];
}

enum ParseState {
  BeforeQuery,
  InQuery,
  InSubshell,
}

function extractReplSections(
  code: string,
  mode: "repl" | "bash" | "powershell"
): ReplSection[] {
  const sections: ReplSection[] = [];
  let state = ParseState.BeforeQuery;
  const lines = code.split("\n");

  const beforeQueryRegex = {
    repl: /([\w\[:\]>]+>\s)(.*)/,
    bash: /(.*\$\s)(.*)/,
    powershell: /(PS>\s)(.*)/,
  }[mode];
  const inQueryRegex = {
    repl: /(\.+\s)(.*)/,
    bash: /([>\s]\s)?(.*)/,
    powershell: /([>\s]\s)?(.*)/,
  }[mode];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (state === ParseState.BeforeQuery) {
      const match = beforeQueryRegex.exec(line);
      if (match) {
        if (mode === "repl" || line.endsWith("\\")) {
          state = ParseState.InQuery;
        } else if (mode === "bash" && line.endsWith("$(")) {
          state = ParseState.InSubshell;
        }
        sections.push({promptLines: [], queryLines: [], outLines: []});
        sections[sections.length - 1].promptLines.push(match[1]);
        sections[sections.length - 1].queryLines.push(match[2]);
      } else {
        if (!sections.length) {
          console.warn(
            `invalid "code-block: ${mode}" (output before query): ` +
              JSON.stringify(code)
          );
          continue;
        }
        sections[sections.length - 1].outLines.push(line);
      }
    } else if (
      state === ParseState.InQuery ||
      state === ParseState.InSubshell
    ) {
      let match = inQueryRegex.exec(line);
      if (match) {
        sections[sections.length - 1].promptLines.push(match[1]);
        sections[sections.length - 1].queryLines.push(match[2]);
      } else if (mode === "repl") {
        state = ParseState.BeforeQuery;
        i--;
        continue;
      }

      if (state === ParseState.InSubshell && /^\s*\)/.test(match?.[2] ?? "")) {
        state = ParseState.InQuery;
      }

      if (mode === "bash" && line.endsWith("$(")) {
        state = ParseState.InSubshell;
      } else if (
        state === ParseState.InQuery &&
        mode !== "repl" &&
        !line.endsWith("\\")
      ) {
        state = ParseState.BeforeQuery;
      }
    }
  }

  return sections;
}

export function highlight(
  code: string,
  prismLang: Prism.Grammar,
  lang: string,
  inline: boolean = false
): string {
  let hl = escapeHtml;
  if (prismLang) {
    hl = (s) => Prism.highlight(s, prismLang, lang);
  }

  if (inline) {
    return hl(code);
  }

  const sections = extractSections(code);
  const html = [];
  for (let section of sections) {
    let code = hl(section.str);
    code = `<span class="tokens tokens-${section.type}">${code}</span>`;
    html.push(code);
  }

  return html.join("");
}

export interface CodeProps {
  code: string | {default: string; [version: string]: string};
  language: string;
  className?: string;
  linesBeforeCollapse?: number;
  collapsible?: boolean;
  inline?: boolean;
  noCopy?: boolean;
  noBashMode?: boolean;
  allowCopyOverlap?: boolean;
  showLineNumbers?: boolean;
  caption?: JSX.Element;
}

export function Code({
  code: _code,
  language,
  className,
  linesBeforeCollapse = 12,
  collapsible = false,
  inline,
  noCopy,
  noBashMode,
  allowCopyOverlap,
  showLineNumbers,
  caption,
  ...otherProps
}: CodeProps & {[key: string]: any}) {
  const [collapsed, setCollapsed] = useState(true);

  const codeRef = useRef<HTMLDivElement>(null);

  const isOverlayActive = useIsOverlayActive();

  let code: string;
  if (typeof _code === "string") {
    code = _code;
  } else {
    const version = useDocVersion()?.version;
    const {default: def, ..._versions} = _code;
    code = def;
    const versions = [...Object.entries(_versions)].sort((a, b) =>
      a[0] > b[0] ? 1 : -1
    );
    for (const [ver, verCode] of versions) {
      if (version < ver) {
        code = verCode;
        break;
      }
    }
  }

  // Workaround for a weird safari behaviour where scrolling is broken in
  // mobile overlay menu's if 'overflow-x: auto' is set on code blocks that
  // are in the viewport
  const scrollDisabled =
    isOverlayActive && window.matchMedia("(max-width: 1024px)").matches;

  let replMode = false;
  let diffMode = false;
  if (language.includes("-")) {
    const [left, right] = language.split("-", 2);
    if (right === "repl") {
      replMode = true;
      language = left;
    } else if (right === "diff") {
      diffMode = true;
      language = left;
    }
  } else if (language == "pycon") {
    replMode = true;
    language = "python";
  }

  const prismLang = Prism.languages[language];
  const prismCls = prismLang ? `code-language-${language}` : undefined;

  if (inline) {
    const html = highlight(code, prismLang, language, inline);

    return (
      <span
        className={cn(styles.code, styles.inline, prismCls, className)}
        {...otherProps}
        dangerouslySetInnerHTML={{__html: html}}
      ></span>
    );
  }

  const bashMode =
    !noBashMode && (language === "bash" || language === "powershell")
      ? language
      : null;
  const showCopyButton = !(
    noCopy ||
    language === "default" ||
    language.includes("synopsis")
  );

  const lines = code.split("\n");
  const maxLineLength = Math.max(...lines.map((line) => line.length));
  const nlines = lines.length;

  const canCollapse = collapsible && nlines > linesBeforeCollapse;
  const onCollapse = () => {
    setCollapsed(!collapsed);

    if (!collapsed) {
      const el = codeRef.current;
      if (el) {
        let top = el.offsetTop;
        let pel = el;
        while (pel.offsetParent) {
          pel = pel.offsetParent as HTMLDivElement;
          top += pel.offsetTop;
        }

        if (top < window.pageYOffset) {
          el.scrollIntoView();
        }
      }
    }
  };

  const diffLines: ("p" | "m" | undefined)[] = [];
  if (diffMode) {
    code = lines
      .map((line, i) => {
        switch (line.slice(0, 2)) {
          case "+ ":
          case "- ":
            diffLines.push(line[0] === "+" ? "p" : "m");
            break;
          case "  ":
            diffLines.push(undefined);
            break;
          default:
            if (line.trim() === "") {
              diffLines.push(undefined);
            } else {
              console.warn(
                `diff line ${i} does not start with '+ ', '- ', or '  '`
              );
            }
        }
        return line.slice(2);
      })
      .join("\n");
  }

  const content: JSX.Element[] = [];
  if (replMode || !!bashMode) {
    const sections = extractReplSections(code, bashMode ?? "repl");

    let sectionIndex = 0;
    for (let {promptLines, queryLines, outLines} of sections) {
      const code = queryLines.join("\n");
      const html = highlight(code, prismLang, language, false);

      content.push(
        <div className={styles.highlightWrapper} key={sectionIndex++}>
          {showCopyButton
            ? CopyCodeWrapper(
                code,
                allowCopyOverlap ? "" : promptLines[0] + queryLines[0]
              )
            : null}
          <div className={styles.block}>
            <div className={cn(styles.codePart, prismCls)}>
              <pre>{promptLines.join("\n")}</pre>
              <pre dangerouslySetInnerHTML={{__html: html}}></pre>
            </div>
            <div className={styles.outPart}>
              <pre>{outLines.join("\n")}</pre>
            </div>
          </div>
        </div>
      );
    }
  } else {
    const html = highlight(code, prismLang, language, inline);
    content.push(
      <div className={styles.highlightWrapper} key={"loneBlock"}>
        {showCopyButton
          ? CopyCodeWrapper(
              code,
              allowCopyOverlap ? "" : code.split("\n", 1)[0]
            )
          : null}
        {diffMode ? (
          <div className={styles.diffLines}>
            {diffLines.map((line, i) => (
              <div className={styles[line as any]} key={i} />
            ))}
          </div>
        ) : null}
        <div className={styles.block}>
          {showLineNumbers ? (
            <pre className={styles.lineNumbers}>
              {code
                .split("\n")
                .map((_, i) => i + 1)
                .join("\n")}
            </pre>
          ) : null}
          <pre dangerouslySetInnerHTML={{__html: html}} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(styles.code, prismCls, className, {
        [styles.repl]: replMode || !!bashMode,
        [styles.showHighlight]: showCopyButton && content.length > 1,
        [styles.collapsed]: canCollapse && collapsed,
        [styles.expanded]: canCollapse && !collapsed,
        [styles.scrollDisabled]: scrollDisabled,
      })}
      ref={codeRef}
      style={
        {
          "--maxLineLength": maxLineLength,
          "--code-max-height": linesBeforeCollapse,
        } as any
      }
      {...otherProps}
    >
      {caption && <span className={cn(styles.caption)}>{caption}</span>}
      {content}
      {canCollapse ? (
        <div className={styles.showMore} onClick={onCollapse}>
          {collapsed ? "Show more" : "Show less"}
          <CodeExpandIcon />
        </div>
      ) : null}
    </div>
  );
}

function BaseSig({signature, grammar}: {signature: string; grammar: string}) {
  const prismLang = Prism.languages[grammar];
  const html = highlight(signature, prismLang, grammar, true);

  return (
    <span className={cn(styles.funcsig, {longsig: signature.length > 60})}>
      <span dangerouslySetInnerHTML={{__html: html}}></span>
    </span>
  );
}

export function PythonFuncSig({signature}: {signature: string}) {
  return <BaseSig signature={signature} grammar={"python_function"} />;
}

export function JSFuncSig({signature}: {signature: string}) {
  return <BaseSig signature={signature} grammar={"js_function"} />;
}

export function JSClassSig({signature}: {signature: string}) {
  return <BaseSig signature={signature} grammar={"js_class"} />;
}

export function CSClassSig({signature}: {signature: string}) {
  return <BaseSig signature={signature} grammar={"cs"} />;
}

export function CSFuncSig({signature}: {signature: string}) {
  return <BaseSig signature={signature} grammar={"cs"} />;
}

export function FuncSig({signature}: {signature: string}) {
  return <BaseSig signature={signature} grammar={"eql_function"} />;
}

export function OpSig({signature}: {signature: string}) {
  return <BaseSig signature={signature} grammar={"eql_operator"} />;
}

export interface MigrationProps {
  pre: string;
  schema: string;
  suf: string;
  className?: string;
}

export function Migration({
  pre,
  schema,
  suf,
  className,
  ...otherProps
}: MigrationProps & {[key: string]: any}) {
  const html = `<span class="tokens"
        ><span class="token faded">${escapeHtml(pre)}</span></span>${highlight(
    schema,
    Prism.languages["eschema"],
    "eschema"
  )}<span class="tokens"
        ><span class="token faded">${escapeHtml(suf)}</span></span>`;

  return (
    <pre
      className={cn(
        className,
        "code-language-eschema",
        styles.code,
        "eql-block-pre",
        styles.block
      )}
      {...otherProps}
    >
      <span
        className={styles.wrapper}
        dangerouslySetInnerHTML={{__html: html}}
      ></span>
    </pre>
  );
}

function CopyCodeWrapper(code: string, firstLine: string) {
  return (
    <>
      <div className={styles.copyCodeButtonWrapper}>
        <CopyCode code={code} />
      </div>
      {false && (
        <div className={styles.copyCodeDisplaceWrapper}>
          <div
            className={styles.copyCodeFirstLine}
            style={{
              width: firstLine.length + "ch",
            }}
          />
          <div className={styles.copyCode} />
        </div>
      )}
    </>
  );
}

interface CopyCodeProps {
  code: string;
  className?: string;
}

export function CopyCode({code, className}: CopyCodeProps) {
  const [showMessage, setShowMessage] = useState(false);
  const timeout = useRef<NodeJS.Timeout>();

  return (
    <div
      className={cn(styles.copyCode, className)}
      onClick={() => {
        navigator.clipboard?.writeText(code);
        if (timeout.current) {
          clearTimeout(timeout.current);
        }
        setShowMessage(true);
        timeout.current = setTimeout(() => setShowMessage(false), 2000);
      }}
    >
      <CopyIcon />
      {showMessage ? "Copied!" : "Copy"}
    </div>
  );
}
