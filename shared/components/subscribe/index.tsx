"use client";

import { useRef, useState } from "react";

export type SubscribeResponse =
  | {
      result: "success";
      msg?: string;
    }
  | { result: "error"; msg: string };

async function subscribe(
  email: string,
  tag?: string
): Promise<SubscribeResponse> {
  const res = await fetch(
    `${
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://www.edgedb.com"
    }/api/subscribe`,
    {
      method: "POST",
      body: new URLSearchParams({
        email,
        ...(tag ? { tag } : {}),
      }),
    }
  );
  if (res.ok) return res.json();
  return {
    result: "error",
    msg: `Email subscribe failed: ${res.statusText}`,
  };
}

function renderError(errorMsg: string): JSX.Element {
  const error: (JSX.Element | string)[] = [];

  const regex = /<a.+?href="([^"]+)"[^>]*>([^<]+)<\/a>/g;

  let match: RegExpExecArray | null = null;
  let cursor = 0;
  while ((match = regex.exec(errorMsg)) !== null) {
    error.push(errorMsg.slice(cursor, match.index));
    cursor += match.index + match[0].length;
    error.push(<a href={match[1]}>{match[2]}</a>);
  }
  error.push(errorMsg.slice(cursor));

  return <>{error}</>;
}

interface SubscribeProps {
  styles?: { readonly [key: string]: string };
  inputPlaceholder?: string;
  buttonText?: string;
  submittingButtonText?: string;
  tag?: string;
}

export function SubscribeForm({
  styles,
  inputPlaceholder,
  buttonText,
  submittingButtonText,
  tag,
}: SubscribeProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [successful, setSuccessful] = useState<string | boolean>(false);
  const [errorMsg, setErrorMsg] = useState<JSX.Element | null>(null);

  return successful ? (
    <div className={styles?.successMsg}>
      {successful === true
        ? "Subscribed! A confirmation has been sent to your email address."
        : successful}
    </div>
  ) : (
    <>
      {errorMsg ? <div className={styles?.errorMsg}>{errorMsg}</div> : null}
      <form
        className={errorMsg ? styles?.error : undefined}
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();

          const validity = inputRef.current?.validity;
          if (validity?.valid) {
            const email = (inputRef.current?.value ?? "").trim();
            setSubscribing(true);
            const res = await subscribe(email, tag);
            setSubscribing(false);
            if (res.result === "error") {
              setErrorMsg(renderError(res.msg));
            } else if (res.result === "success") {
              setSuccessful(
                typeof res.msg === "string" &&
                  res.msg.includes("already subscribed")
                  ? res.msg
                  : true
              );
            }
          } else {
            if (validity?.typeMismatch) {
              setErrorMsg(<>Invalid email address</>);
            } else {
              setErrorMsg(<>Email address is required</>);
            }
          }
        }}
      >
        <input
          ref={inputRef}
          type="email"
          required
          placeholder={inputPlaceholder}
          disabled={subscribing}
        />
        <button type="submit" disabled={subscribing}>
          {subscribing
            ? submittingButtonText ?? buttonText ?? "Subscribing..."
            : buttonText ?? "Subscribe"}
        </button>
      </form>
    </>
  );
}
