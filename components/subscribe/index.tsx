import {useRef, useState} from "react";

import styles from "./subscribe.module.scss";

async function subscribe(email: string) {
  const res = await fetch(`/api/subscribe`, {
    method: "POST",
    body: new URLSearchParams({
      email,
    }),
  });
  if (res.ok) return res.json();
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
  styles?: {readonly [key: string]: string};
  inputPlaceholder?: string;
  buttonText?: string;
}

export function SubscribeForm({
  styles,
  inputPlaceholder,
  buttonText,
}: SubscribeProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [successful, setSuccessful] = useState(false);
  const [errorMsg, setErrorMsg] = useState<JSX.Element | null>(null);

  return successful ? (
    <div className={styles?.successMsg}>
      Subscribed! A confirmation has been sent to your email address.
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
            const res = await subscribe(email);
            if (res.result === "error") {
              setErrorMsg(renderError(res.msg));
            } else if (res.result === "success") {
              setSuccessful(true);
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
        />
        <button type="submit">{buttonText ?? "Subscribe"}</button>
      </form>
    </>
  );
}

interface SubscribePopupProps {
  onClose: () => void;
}

export function SubscribePopup({onClose}: SubscribePopupProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          Keep me in the loop!
          <PopupCloseIcon className={styles.closePopup} onClick={onClose} />
        </div>
        <div className={styles.content}>
          <p>
            We will notify you when a public preview of EdgeDB is available or
            when we post to our blog.
          </p>
          <p>You can unsubscribe at any point.</p>

          <div className={styles.form}>
            <SubscribeForm
              styles={styles}
              inputPlaceholder="Enter your email"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PopupCloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.5793 22.1284L22.3342 19.3643L8.55941 5.54405L5.80444 8.30811L19.5793 22.1284Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.3342 8.30853L8.55941 22.1288L5.80444 19.3647L19.5793 5.54448L22.3342 8.30853Z"
        fill="white"
      />
    </svg>
  );
}
