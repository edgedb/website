export class PromisePool {
  constructor(public maxConcurrency: number) {}

  activeCount = 0;
  waiting: (() => void)[] = [];

  async run<T>(action: () => Promise<T>): Promise<T> {
    if (this.activeCount >= this.maxConcurrency) {
      await new Promise((resolve) => this.waiting.push(resolve as any));
    }
    this.activeCount++;
    const ret = await action();
    this.activeCount--;
    if (this.waiting.length) {
      this.waiting.shift()!();
    }
    return ret;
  }
}
