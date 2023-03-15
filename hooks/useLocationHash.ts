import {useState} from "react";

export function useLocationHash() {
  const [hash, setHash] = useState(
    typeof location !== "undefined" ? location.hash.slice(1) : ""
  );

  return [
    hash,
    (hash: string) => {
      history.replaceState(history.state, "", `${location.pathname}#${hash}`);
      setHash(hash);
    },
  ] as [string, (hash: string) => void];
}
