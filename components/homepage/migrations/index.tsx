import {useEffect, useMemo, useRef, useState} from "react";

import cn from "@/utils/classNames";

import {Prism} from "@/components/code";

import styles from "./homepageMigrations.module.scss";
import {PauseIcon, PlayIcon} from "./icons";

import {
  token,
  Timeline,
  useProgress,
  getTimelineProgress,
  renderTokenisedText,
} from "./animations";

// progress (0 -> 1) per millisecond
const animationSpeed = 0.00015;

const lineNumbers = Array(8)
  .fill(0)
  .map((_, i) => i + 1)
  .join("\n");

const kw = token("token keyword");
const op = token("token operator");
const bi = token("token builtin");
const prompt = token(styles.prompt);
const ty = token(styles.terminalYellow);
const tb = token(styles.terminalBold);
const tbg = token(cn(styles.terminalBold, styles.terminalGreen));

const timeline: Timeline = [
  {type: "delay", duration: 2},
  {type: "addClass", className: styles.showEditorCursor},
  {
    type: "addText",
    id: "schemaInsert",
    text: [`\n    `],
  },
  {type: "addClass", className: styles.schemaNewLineMarker},
  {
    type: "typewriter",
    id: "schemaInsert",
    duration: 20,
    text: [kw`required property`, ` email `, op`->`, ` `, bi`str`, `;`],
  },
  {type: "keypoint"},
  {type: "delay", duration: 2},
  {type: "removeClass", className: styles.showEditorCursor},
  {type: "addClass", className: styles.showTerminal},
  {
    type: "typewriter",
    id: "terminal",
    duration: 15,
    text: [
      `edgedb migration create
`,
    ],
  },
  {type: "keypoint"},
  {type: "delay", duration: 2},
  {
    type: "addText",
    id: "terminal",
    text: [
      ty`did you create property 'email' on object type 'default::User'? [y,n,l,c,b,s,q,?]
`,
      prompt`> `,
    ],
  },
  {type: "keypoint"},
  {type: "delay", duration: 2},
  {
    type: "addText",
    id: "terminal",
    text: [
      `y
`,
    ],
  },
  {type: "delay", duration: 2},
  {
    type: "addText",
    id: "terminal",
    text: [
      `Please specify an expression to populate existing objects in order to make property 'email' of object type 'default::User' required:
`,
      prompt`fill_expr> `,
    ],
  },
  {type: "keypoint"},
  {
    type: "typewriter",
    id: "terminal",
    duration: 7,
    text: [
      token(styles.terminalGreen)`"example@example.com"
`,
    ],
  },
  {type: "delay", duration: 2},
  {
    type: "addText",
    id: "terminal",
    text: [
      tbg`Created`,
      tb` ./dbschema/migrations/00001.edgeql`,
      `, id: m1kdtk6ze2irotrxzscsr5hmt55zxvviqyfn26jrw5ei6...
`,
      prompt`$ `,
    ],
  },
  {type: "addClass", className: styles.showGenMigration},
  {type: "keypoint"},
  {type: "delay", duration: 2},
  {
    type: "typewriter",
    id: "terminal",
    duration: 15,
    text: [
      `edgedb migration apply
`,
    ],
  },
  {type: "delay", duration: 2},
  {
    type: "addText",
    id: "terminal",
    text: [
      tbg`Applied`,
      tb` m1kdtk6ze2irotrxzscsr5hmt55zxvviqyfn2...`,
      ` (00001.edgeql)`,
    ],
  },
];

export default function Migrations({className}: {className?: string}) {
  const ref = useRef<HTMLDivElement>(null);

  const {
    progress,
    setTargetProgress,
    animationRunning,
    togglePlayPause,
  } = useProgress(animationSpeed);

  const {strings, classNames, keypoints} = getTimelineProgress(
    timeline,
    progress
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.unobserve(ref.current!);
          setTargetProgress(1);
        }
      },
      {threshold: 0.7}
    );

    observer.observe(ref.current!);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn(styles.wrapper, className)}>
      <div className={styles.controls}>
        <div
          className={styles.controlPlayPause}
          onClick={() => {
            togglePlayPause();
          }}
        >
          {animationRunning ? (
            <PauseIcon />
          ) : progress === 1 ? (
            <PlayIcon /> // todo: restart icon?
          ) : (
            <PlayIcon />
          )}
        </div>
        {keypoints.map((keypoint, i) => (
          <div
            key={i}
            className={styles.controlKeypoint}
            onClick={() => {
              setTargetProgress(
                animationRunning ? 1 : keypoints[i + 1] ?? 1,
                keypoint
              );
            }}
          >
            <div>
              <div
                style={{
                  width:
                    (progress < keypoint
                      ? 0
                      : (progress - keypoint) /
                        ((keypoints[i + 1] ?? 1) - keypoint)) *
                      100 +
                    "%",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={cn(styles.container, ...classNames)}>
        <div className={styles.editorPanel}>
          <div className={styles.editorTabs}>
            <div className={cn(styles.editorTab, styles.schemaTab)}>
              schema.esdl
            </div>
            <div className={cn(styles.editorTab, styles.migrationTab)}>
              migrations/0001.edgeql
            </div>
          </div>
          <div className={styles.editorContentContainer}>
            <pre className={cn(styles.editorContent, styles.schemaEdit)}>
              <div className={styles.editorLineNumbers}>{lineNumbers}</div>
              <div className={styles.editorCode}>
                {renderTokenisedText([
                  kw`module default`,
                  ` {
  `,
                  kw`type`,
                  ` User {
    `,
                  kw`required property`,
                  ` username `,
                  op`->`,
                  ` `,
                  bi`str`,
                  `;`,
                  ...strings.schemaInsert,
                ])}
                <span className={styles.cursor} />
                {`
  }
}`}
              </div>
            </pre>
            <pre className={cn(styles.editorContent, styles.genMigration)}>
              <div className={styles.editorLineNumbers}>{lineNumbers}</div>
              <div
                className={styles.editorCode}
                dangerouslySetInnerHTML={{
                  __html: Prism.highlight(
                    `CREATE MIGRATION m1kdtk6ze2irotrxzscsr5hmt55zxv...
{
  ALTER TYPE default::User {
    CREATE REQUIRED PROPERTY email -> std::str {
      SET REQUIRED USING ('example@example.com');
    };
  };
};`,
                    Prism.languages["edgeql"],
                    "edgeql"
                  ),
                }}
              />
            </pre>
          </div>
        </div>

        <div className={styles.terminal}>
          <div className={styles.terminalHeader} />
          <div className={styles.terminalOverflowWrapper}>
            <pre className={styles.terminalInner}>
              <span className={styles.prompt}>{`$ `}</span>
              {renderTokenisedText(strings.terminal)}
              <span className={styles.cursor} />
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
