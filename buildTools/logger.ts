import chalk from "chalk";

export interface Logger {
  log(...args: any[]): void;
  info(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  time(label?: string): void;
  timeEnd(label?: string): void;
}

export type LoggerColour =
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white";

export class PrefixedLogger implements Logger {
  private _prefix: string;

  constructor(prefix: string, colour: LoggerColour = "white") {
    this._prefix = chalk.grey("[" + chalk[colour](prefix) + "]");
  }

  log(...args: any[]) {
    console.log(this._prefix, ...args);
  }

  info(...args: any[]) {
    console.info(this._prefix, ...args);
  }

  error(...args: any[]) {
    console.error(this._prefix, ...args);
  }

  warn(...args: any[]) {
    console.warn(this._prefix, ...args);
  }

  time(label: string = "") {
    console.time(`${this._prefix} ${label}`);
  }

  timeEnd(label: string = "") {
    console.timeEnd(`${this._prefix} ${label}`);
  }
}
