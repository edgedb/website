export function mediaQuery(
  query: string,
  onChange: (mq: MediaQueryList | MediaQueryListEvent) => void,
  initial?: boolean
): () => void {
  const mediaQuery = window.matchMedia(query);

  mediaQuery.addEventListener
    ? mediaQuery.addEventListener("change", onChange)
    : mediaQuery.addListener(onChange);

  if (initial) {
    onChange(mediaQuery);
  }

  return () => {
    mediaQuery.removeEventListener
      ? mediaQuery.removeEventListener("change", onChange)
      : mediaQuery.removeListener(onChange);
  };
}
