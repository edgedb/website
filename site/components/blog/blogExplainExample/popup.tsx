import {useCallback, useEffect, useRef, useState} from "react";

import {ExplainVis} from "@edgedb/studio/components/explainVis";
import {createExplainState} from "@edgedb/studio/components/explainVis/state";
import {ExplainCodeBlock} from "@edgedb/studio/components/explainVis/codeblock";
import {
  ExplainHighlightsRef,
  ExplainHighlightsRenderer,
} from "@edgedb/studio/components/explainVis/codeEditorContexts";

import {Theme, ThemeProvider} from "@edgedb/common/hooks/useTheme";

import styles from "./blogExplainExample.module.scss";

import data from "./data.raw.json";

const query = JSON.parse((data as unknown) as string).buffers[0];

const explainState = createExplainState((data as unknown) as string);

export default function BlogExplainPopup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ref, setRef] = useState<ExplainHighlightsRef | null>(null);

  const explainHighlightsRef = useCallback((node: any) => {
    if (node) {
      setRef(node);
    }
  }, []);

  useEffect(() => {
    if (ref && containerRef.current) {
      ref.updateContextRects(containerRef.current);
    }
  }, [ref]);

  return (
    <ThemeProvider forceTheme={Theme.light}>
      <div className={styles.popupContainer}>
        <div className={styles.query}>
          <div className={styles.queryLineNo}>
            {Array(query.split("\n").length)
              .fill(0)
              .map((_, i) => i + 1)
              .join("\n")}
          </div>
          <div ref={containerRef} className={styles.queryCode}>
            <ExplainCodeBlock
              code={query}
              explainContexts={explainState.contextsByBufIdx[0]}
            />
            <div className={styles.highlightsContainer}>
              <ExplainHighlightsRenderer
                ref={explainHighlightsRef}
                state={explainState}
                isEditor={false}
              />
            </div>
          </div>
        </div>
        <div className={styles.vis}>
          <ExplainVis state={explainState} />
        </div>
      </div>
    </ThemeProvider>
  );
}
