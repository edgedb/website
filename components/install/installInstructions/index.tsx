import {useState, useMemo, useEffect, useRef} from "react";

import cn from "@/utils/classNames";

import type {
  InstallInstructionsData,
  InstallInstruction,
} from "dataSources/install";

import {useLocationHash} from "hooks/useLocationHash";

import {ControlledTabs} from "@/components/install/tabs";
import {Code} from "@/components/code";

import styles from "./installInstructions.module.scss";

interface InstallInstructionsProps {
  data: InstallInstructionsData;
}

export default function InstallInstructions({data}: InstallInstructionsProps) {
  const [locationHash, setLocationHash] = useLocationHash();

  const [showOtherOptions, setShowOtherOptions] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const slugs = useMemo(
    () =>
      Object.entries(data).reduce((slugs, [os, group]) => {
        for (const item of group) {
          slugs.set(item.slug, {os, item});
        }
        return slugs;
      }, new Map<string, {os: string; item: InstallInstruction}>()),
    [data]
  );

  const oses = Object.keys(data);

  let selectedOS: string;
  if (showOtherOptions) {
    if (!slugs.has(locationHash)) {
      setLocationHash(slugs.keys().next().value);
    }
    selectedOS = slugs.get(locationHash)?.os ?? oses[0];
  }

  useEffect(() => {
    if (locationHash) {
      setShowOtherOptions(true);

      setTimeout(() => {
        if (sentinelRef.current) {
          window.scrollTo({top: sentinelRef.current.offsetTop});
        }
      }, 0);
    }
  }, []);

  return (
    <div className={styles.additionalMethods}>
      <button
        className={styles.installOptions}
        onClick={() => setShowOtherOptions(!showOtherOptions)}
      >
        <span>
          Additional installation methods {showOtherOptions ? "▼" : "▶"}{" "}
        </span>
      </button>
      <div ref={sentinelRef} />
      {showOtherOptions ? (
        <ControlledTabs
          className={styles.tabs}
          selectedTab={oses.indexOf(selectedOS!)}
          onTabSelected={(tabIndex) =>
            setLocationHash(data[oses[tabIndex]][0].slug)
          }
          tabs={Object.entries(data).map(([os, group]) => {
            return {
              name: os,
              content: (
                <select
                  className={styles.installKindSelect}
                  value={locationHash}
                  onChange={(e) => setLocationHash(e.target.value)}
                >
                  {group.map(({kind, slug}) => (
                    <option key={slug} value={slug}>
                      {kind}
                    </option>
                  ))}
                </select>
              ),
            };
          })}
        />
      ) : null}
      <div className={styles.installInstructionsBlock}>
        {[...slugs.entries()].map(([slug, {os, item}]) => {
          return (
            <div
              key={slug}
              className={cn(styles.tabContents, {
                [styles.active]: showOtherOptions && slug === locationHash,
              })}
            >
              <h3>
                {os} - {item.kind}
              </h3>
              {item.content.map(({type, text}, i) =>
                type === "code" ? (
                  <Code
                    key={i}
                    code={text.trim()}
                    language="bash"
                    noBashMode
                  />
                ) : (
                  <div
                    key={i}
                    style={{display: "contents"}}
                    dangerouslySetInnerHTML={{__html: text}}
                  />
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
