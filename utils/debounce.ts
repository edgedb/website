export function debounceToAnimationFrame<Args extends any[]>(
  cb: (...args: Args) => void
) {
  let updateQueued = false;
  let queuedArgs: Args | null = null;

  return (...args: Args) => {
    queuedArgs = args;
    if (!updateQueued) {
      updateQueued = true;
      requestAnimationFrame(() => {
        cb(...(queuedArgs as Args));
        updateQueued = false;
      });
    }
  };
}
