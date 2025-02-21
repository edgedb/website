import {useState} from "react";
import {useBrowserLayoutEffect} from "./useBrowserLayoutEffect";

export function useQueryParams() {
  const [params, setParams] = useState<URLSearchParams | null>(null);

  useBrowserLayoutEffect(
    () => setParams(new URLSearchParams(document.location.search)),
    []
  );

  return params;
}
