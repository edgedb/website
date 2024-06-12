export type SAEventMetadata = {
  question: string | string[];
  answer?: string;
  error?: string;
  link?: string;
};

declare global {
  function sa_event(eventName: string, metadata: SAEventMetadata);
}
