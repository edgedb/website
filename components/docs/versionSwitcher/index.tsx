import {useEffect, useState} from "react";

import cn from "@/utils/classNames";

import {useDocVersion} from "@/components/docs/docVersionContext";
import {ChevronLeftIcon} from "@/components/icons";

import styles from "./versionSwitcher.module.scss";

import _versions from "@/build-cache/docs/versions.json";

const versions: {version: string; tag?: string}[] = _versions;

export default function VersionSwitcher() {
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
        <ChevronLeftIcon className={styles.dropdownArrow} />
      </div>
      <div
        className={cn(styles.dropdown, {
          [styles.open]: dropdownOpen,
        })}
      >
        {versions.map((ver) => (
          <div
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

function VersionItem({ver}: {ver: typeof versions[number]}) {
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
