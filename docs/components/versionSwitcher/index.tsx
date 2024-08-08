"use client";

import { useEffect, useState } from "react";

import cn from "@edgedb-site/shared/utils/classNames";

import { useDocVersion } from "@/hooks/docVersion";
import { ChevronLeftIcon } from "@/components/icons";
import _versions from "@/build-cache/docs/versions.json";
import styles from "./versionSwitcher.module.scss";

const versions: { version: string; tag?: string }[] = _versions;

export function VersionSwitcher() {
  const currentVer = useDocVersion();
  const versionInfo = versions.find(
    (ver) => ver.version === currentVer.version
  )!;

  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (dropdownOpen) {
      window.addEventListener("click", () => setDropdownOpen(false), {
        capture: true,
        once: true,
      });
    }
  }, [dropdownOpen]);

  return (
    <div className={styles.versionSwitcherWrapper}>
      <div
        className={styles.versionSwitcher}
        onClick={() => setDropdownOpen(true)}
      >
        <VersionItem ver={versionInfo} />
        <DownArrowIcon className={styles.dropdownArrow} />
      </div>

      <div
        className={cn(styles.dropdown, {
          [styles.open]: dropdownOpen,
        })}
      >
        {versions.map((ver, index) => (
          <div
            key={index}
            className={styles.item}
            onClick={() => currentVer.setVersion(ver.version)}
          >
            <VersionItem ver={ver} />
          </div>
        ))}
      </div>
    </div>
  );
}

function VersionItem({ ver }: { ver: typeof versions[number] }) {
  return (
    <>
      v{ver.version.split(".")[0]}
      {ver.tag ? (
        <span
          className={cn(styles.tag, {
            [styles.dev]: ver.tag === "dev",
          })}
        >
          {ver.tag}
        </span>
      ) : null}
    </>
  );
}

function DownArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="8"
      height="8"
      viewBox="-1 -1 8 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.92327 1.17363L3.48854 5.39079C3.27126 5.76708 2.72825 5.76708 2.51097 5.39079L0.0762461 1.17363C-0.14104 0.797345 0.130461 0.326986 0.565033 0.326986L5.43448 0.326986C5.86905 0.326986 6.14055 0.797345 5.92327 1.17363Z"
        fill="currentColor"
      />
    </svg>
  );
}
