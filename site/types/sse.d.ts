declare module "sse.js" {
  export type SSEOptions = EventSourceInit & {
    payload?: string;
  };

  export class SSE extends EventSource {
    constructor(url: string | URL, sseOptions?: SSEOptions);
    stream(): void;
  }
}
