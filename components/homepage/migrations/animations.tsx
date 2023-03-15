import {useMemo, useRef, useState} from "react";

export interface TokenisedText {
  type: string;
  text: string;
}

export const token = (tokenType: string) => (
  strings: TemplateStringsArray,
  ...exprs: any[]
): TokenisedText => {
  return {
    type: tokenType,
    text:
      strings
        .slice(0, -1)
        .reduce((text, str, i) => text + str + String(exprs[i]), "") +
      strings[strings.length - 1],
  };
};

export function renderTokenisedText(tokens: (TokenisedText | string)[]) {
  return tokens.map((token, i) =>
    typeof token === "string" ? (
      token
    ) : (
      <span key={i} className={token.type}>
        {token.text}
      </span>
    )
  );
}

export type Timeline = (
  | {type: "delay"; duration: number}
  | {
      type: "addText";
      id: string;
      text: (TokenisedText | string)[];
    }
  | {
      type: "addClass";
      className: string;
    }
  | {type: "removeClass"; className: string}
  | {
      type: "typewriter";
      id: string;
      duration: number;
      text: (TokenisedText | string)[];
    }
  | {
      type: "keypoint";
    }
)[];

export function getTimelineProgress(timeline: Timeline, progress: number) {
  const [totalDuration, stringIds, partStrLengths, keypoints] = useMemo(() => {
    let totalDuration = 0;
    const stringIds = new Set<string>();
    const partStrLengths: number[] = [];
    const keypoints: number[] = [];
    for (const part of timeline) {
      if (part.type === "typewriter") {
        totalDuration += part.duration;
        stringIds.add(part.id);
        partStrLengths.push(
          part.text.reduce(
            (t, s) => t + (typeof s === "string" ? s.length : s.text.length),
            0
          )
        );
      } else {
        partStrLengths.push(0);
        if (part.type === "delay") {
          totalDuration += part.duration;
        }
        if (part.type === "addText") {
          stringIds.add(part.id);
        }
        if (part.type === "keypoint") {
          keypoints.push(totalDuration);
        }
      }
    }
    return [
      totalDuration,
      stringIds,
      partStrLengths,
      [0, ...keypoints.map((keypoint) => keypoint / totalDuration)],
    ];
  }, [timeline]);

  const strings: {[id: string]: (TokenisedText | string)[]} = {};
  const classNames = new Set<string>();

  for (const id of stringIds) {
    strings[id] = [];
  }

  const end = totalDuration * progress;

  let p = 0;
  let i = 0;
  for (const part of timeline) {
    switch (part.type) {
      case "delay":
        p += part.duration;
        break;
      case "addText":
        strings[part.id].push(...part.text);
        break;
      case "addClass":
        classNames.add(part.className);
        break;
      case "removeClass":
        classNames.delete(part.className);
        break;
      case "typewriter":
        if (p + part.duration <= end) {
          strings[part.id].push(...part.text);
        } else {
          const strs: (TokenisedText | string)[] = [];
          const chars = Math.round(
            partStrLengths[i] * ((end - p) / part.duration)
          );
          let c = 0;
          for (const tok of part.text) {
            const s = typeof tok === "string" ? tok : tok.text;
            if (c + s.length < chars) {
              strs.push(tok);
            } else {
              strs.push(
                typeof tok === "string"
                  ? tok.slice(0, chars - c)
                  : {type: tok.type, text: tok.text.slice(0, chars - c)}
              );
              break;
            }
            c += s.length;
          }
          strings[part.id].push(...strs);
        }
        p += part.duration;
        break;
    }
    if (p > end) break;
    i++;
  }

  return {strings, classNames, keypoints};
}

export function useProgress(animationSpeed: number) {
  const [progress, setProgress] = useState(0);
  const [animationRunning, setAnimationRunning] = useState<number | null>(
    null
  );
  const targetProgress = useRef(0);

  const setTargetProgress = (newTargetProgress: number, from?: number) => {
    if (animationRunning !== null) {
      cancelAnimationFrame(animationRunning);
    }
    targetProgress.current = newTargetProgress;
    let lastProgress = from ?? progress;
    let lastTime = performance.now();

    const rafCallback = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      let updatedProgress = Math.min(
        lastProgress + deltaTime * animationSpeed,
        targetProgress.current
      );
      lastProgress = updatedProgress;
      setProgress(updatedProgress);
      setAnimationRunning(
        updatedProgress !== targetProgress.current
          ? requestAnimationFrame(rafCallback)
          : null
      );
    };
    setAnimationRunning(requestAnimationFrame(rafCallback));
    if (from !== undefined) {
      setProgress(from);
    }
  };

  const togglePlayPause = () => {
    if (animationRunning !== null) {
      cancelAnimationFrame(animationRunning);
      setAnimationRunning(null);
    } else {
      setTargetProgress(1, progress === 1 ? 0 : undefined);
    }
  };

  return {
    progress,
    setTargetProgress,
    animationRunning: animationRunning !== null,
    togglePlayPause,
  };
}
