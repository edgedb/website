import { SAEventMetadata } from "@/types/sa_event";

export enum EVENT_NAME {
  GPT_SUBMIT = "gpt_submit",
  VOTE_UP = "vote_up",
  VOTE_DOWN = "vote_down",
  ERROR = "error",
  INVALID_LINK = "invalid_link",
}

export const saEvent = (eventName: string, metadata: SAEventMetadata) => {
  if (window && window.sa_event) return window.sa_event(eventName, metadata);
};

export const fetchRetry = async (
  url: RequestInfo | URL,
  options: RequestInit | undefined,
  n: number
): Promise<Response> => {
  try {
    const response = await fetch(url, options);

    if (response.status !== 200 || !response.ok) {
      const error = await response.json();
      throw new Error(error);
    }

    return response;
  } catch (error) {
    if (n === 1) throw error;

    await wait(500);
    return await fetchRetry(url, options, n - 1);
  }
};

export const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
