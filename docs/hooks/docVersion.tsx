"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";

import { useBrowserLayoutEffect } from "@edgedb-site/shared/hooks/useBrowserLayoutEffect";

import _versions from "@/build-cache/docs/versions.json";

const versions: { version: string; tag?: string }[] = _versions;

export const DocVersionContext = createContext<{
  version: string;
  setVersion: (version: string) => void;
}>(null!);

export function DocVersionProvider({ children }: PropsWithChildren<{}>) {
  const [version, _setVersion] = useState(
    (versions.find((ver) => ver.tag === "latest") ?? versions[0]).version
  );

  useBrowserLayoutEffect(() => {
    const storedVersion = sessionStorage.getItem("docsVersion");
    const ver =
      storedVersion &&
      versions.find((ver) => ver.version === storedVersion)?.version;
    if (ver) {
      _setVersion(ver);
    }
  }, []);

  const setVersion = useCallback((version: string) => {
    _setVersion(version);
    sessionStorage.setItem("docsVersion", version);
  }, []);

  return (
    <DocVersionContext.Provider value={{ version, setVersion }}>
      {children}
    </DocVersionContext.Provider>
  );
}

export const useDocVersion = () => useContext(DocVersionContext);
