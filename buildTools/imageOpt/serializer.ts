export default function createSerializer<T>() {
  const queue: Array<() => Promise<void>> = [];
  let active = false;

  return (fn: () => Promise<T>) => {
    let deferredResolve: (value: T | PromiseLike<T>) => void;
    let deferredReject: (reason?: any) => void;

    const deferred = new Promise<T>((resolve, reject) => {
      deferredResolve = resolve;
      deferredReject = reject;
    });

    const exec = async () => {
      await fn().then(deferredResolve, deferredReject);
      if (queue.length > 0) {
        const func = queue.shift()!;
        func();
      } else {
        active = false;
      }
    };

    if (active) {
      queue.push(exec);
    } else {
      active = true;
      exec();
    }
    return deferred;
  };
};
