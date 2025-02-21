import { useRef, useState, useEffect } from "react";
import { SSE, SSEvent } from "sse.js";
import { observer } from "mobx-react";
import { toJS } from "mobx";

import cn from "@edgedb-site/shared/utils/classNames";
import { useBreakpoint } from "@edgedb-site/shared/hooks/useBreakpoint";

import ExampleCard from "./components/exampleCard";
import History from "./components/history";
import ChatItem from "./components/chatItem";

import { errors, summarySeparator } from "./consts";
import { initDB } from "./indexdb";
import { defaultChatName, fillStore, store } from "./state";
import { saEvent, EVENT_NAME } from "./utils";

import { GPTLogo, RunIcon } from "./icons";

import styles from "./gpt.module.scss";
import { CloseIcon } from "../search/icons";

const gptWelcomeText = (
  <p className={styles.welcomeText}>
    We use ChatGPT with additional context from our documentation to answer your
    questions. Not all answers will be accurate. Please join{" "}
    <a href="https://discord.gg/umUueND6ag">our Discord</a> if you need more
    help.
  </p>
);

const promptExamples = {
  p1: "What are access policies in EdgeDB?",
  p2: "Can you define a User type with 2 string properties and a link to itself?",
};

const isMac =
  typeof navigator !== "undefined"
    ? navigator.platform.toLowerCase().includes("mac")
    : false;

const ctrlKey = isMac ? "cmd" : "ctrl";

const GPTPanel = observer(function GPTPanel({
  closePanel: _closePanel,
}: {
  closePanel: () => void;
}) {
  const chatRef = useRef<HTMLDivElement>(null);

  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "xs" || breakpoint === "sm";
  const isDesktop = !isMobile && breakpoint != "md";
  const eventSourceRef = useRef<SSE>();
  const [prompt, setPrompt] = useState("");
  const [question, setQuestion] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [answer, setAnswer] = useState<string | undefined>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [disableCopyHover, setDisableCopyHover] = useState(false);
  const [summary, setSummary] = useState("");

  const questionRef = useRef(question);
  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  const currentChat = store.chats[store.currentChatIndex];
  const currentChatItems = currentChat?.items || [];

  const activeChat = store.chats[store.activeChatIndex];
  const activeChatItems = activeChat?.items || [];

  const isExistingChat = currentChatItems.length > 0;

  const closePanel = () => {
    setPrompt("");
    _closePanel();
  };

  // This useEffect checks validity of all links provided in the answer.
  // If some link is not valid it will be replaced with "https://www.edgedb.com/docs".
  useEffect(() => {
    if (!disableCopyHover && answer) {
      activeChatItems[activeChatItems.length - 1].updateItem(
        {
          answer,
        },
        store.activeChatIndex
      );

      if (activeChatItems.length === 1) {
        activeChat.updateTitle(summary || question);
        setSummary("");
      }

      setQuestion("");

      let regex = /https:\/\/www.edgedb.com/gi;
      let result;
      let indices = [];
      while ((result = regex.exec(answer))) {
        indices.push(result.index);
      }

      indices.forEach((startIndex) => {
        let link = answer.substring(startIndex);
        let parenthesesIndex = link.indexOf(")");
        let spaceIndex = link.indexOf(" ");

        let endIndex = -1;
        if (parenthesesIndex !== -1 && spaceIndex !== -1)
          endIndex = Math.min(parenthesesIndex, spaceIndex);
        else if (parenthesesIndex !== -1) endIndex = parenthesesIndex;
        else if (spaceIndex !== -1) endIndex = spaceIndex;

        if (endIndex !== -1) link = link.substring(0, endIndex);
        const originalLink = link;

        if (process.env.NODE_ENV === "development")
          link = link.replace(
            "https://www.edgedb.com",
            "http://localhost:3000"
          );

        fetch(link, { method: "head" }).then(({ status }) => {
          if (status === 404) {
            const betterAnswer = answer.replace(
              originalLink,
              "https://www.edgedb.com/docs"
            );
            setAnswer(betterAnswer);
            activeChatItems[activeChatItems.length - 1].updateItem(
              {
                answer: betterAnswer,
              },
              store.activeChatIndex
            );
            saEvent(EVENT_NAME.INVALID_LINK, { question, link: originalLink });
          }
        });
      });
    }
  }, [disableCopyHover]);

  const handleInitDB = async () => await initDB();

  useEffect(() => {
    handleInitDB();
    if (!store.chats.length) fillStore();
  }, []);

  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [store.currentChatIndex]);

  useEffect(() => {
    if (
      chatRef.current &&
      !currentChatItems[currentChatItems.length - 1]?.answer
    ) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [answer]);

  const handleSubmit = (
    e: KeyboardEvent | React.MouseEvent<HTMLButtonElement>,
    examplePrompt?: string
  ) => {
    e.preventDefault();

    if (eventSourceRef.current) eventSourceRef.current.close();

    const question = examplePrompt || prompt;
    setQuestion(question);
    setAnswer(undefined);
    setPrompt("");

    if (store.currentChatIndex == -1) {
      store.setActiveChatIndex(store.chats.length);
      store.addChat({
        title: defaultChatName,
        items: [{ question, answer: "", voted: null }],
      });
    } else {
      store.setActiveChatIndex(store.currentChatIndex);
      store.chats[store.currentChatIndex].addItem({
        question,
        answer: "",
        voted: null,
      });
    }

    generateAnswer(examplePrompt || prompt);
    saEvent(EVENT_NAME.GPT_SUBMIT, { question: examplePrompt || prompt });
  };

  const generateAnswer = async (query: string) => {
    setIsLoading(true);
    setDisableCopyHover(true);
    let isSummaryChunk = false;

    const context: { question: string; answer: string }[] = [];

    if (currentChatItems.length > 1) {
      currentChatItems.slice(0, -1).forEach((item) => {
        context.push({
          question: item.question.trim(),
          answer: item.answer.trim(),
        });
      });
    }

    const eventSource = new SSE(`/api/generate`, {
      payload: JSON.stringify({ query, context }),
    });

    function handleError(err: any) {
      setIsLoading(false);

      const errMessage =
        err.data === errors.flagged ? errors.flagged : errors.default;

      setError(errMessage);
      setAnswer("");

      const activeChat = store.chats[store.activeChatIndex];
      const activeChatItems = activeChat.items;

      activeChatItems[activeChatItems.length - 1].updateItem(
        {
          error: errMessage,
        },
        store.activeChatIndex
      );

      if (activeChatItems.length === 1)
        activeChat.updateTitle(questionRef.current);

      saEvent(EVENT_NAME.ERROR, {
        error: err.data,
        question: questionRef.current,
      });
    }

    function handleMessage(e: SSEvent) {
      try {
        setIsLoading(false);

        let data = e.data;
        if (data === "[DONE]") return setDisableCopyHover(false);

        let completionResponse: Array<any>;

        try {
          completionResponse = [JSON.parse(data)];
        } catch (err) {
          data = data.replace(/}{/g, "},{");

          completionResponse = JSON.parse(`[${data}]`);
        }

        completionResponse.forEach((response) => {
          const text = response.choices[0].delta?.content || "";

          if (text === summarySeparator) isSummaryChunk = true;
          else {
            if (isSummaryChunk) setSummary((summary) => summary + text);
            else
              setAnswer((answer) => {
                return (answer ?? "") + text;
              });
          }
        });
      } catch (err) {
        handleError(err);
      }
    }

    eventSource.onerror = handleError;
    eventSource.onmessage = handleMessage;

    eventSource.stream();
    eventSourceRef.current = eventSource;
  };

  const startNewChat = () => {
    setPrompt("");
    store.setCurrentChatIndex(-1);
  };

  return (
    <div
      className={styles.gptPanel}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={closePanel}
        className={styles.closeButton}
        type="button"
        area-label="close"
      >
        <CloseIcon />
      </button>

      <History
        chats={toJS(store.chats).slice(0).reverse()}
        startNewChat={startNewChat}
        collapsedDefault={isDesktop ? false : true}
        refreshInput={() => setPrompt("")}
      />

      <div className={styles.main}>
        <div className={styles.output} ref={chatRef}>
          {store.currentChatIndex === -1 ? (
            <div className={styles.welcomeScreen}>
              <div className={styles.welcomeIntro}>
                <GPTLogo className={styles.welcomeGptLogo} />
                {gptWelcomeText}
                <div className={styles.exampleCards}>
                  <ExampleCard
                    question={promptExamples.p1}
                    classes={styles.card}
                    handleClick={(e) => handleSubmit(e, promptExamples.p1)}
                  />
                  <ExampleCard
                    question={promptExamples.p2}
                    classes={styles.card}
                    handleClick={(e) => handleSubmit(e, promptExamples.p2)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {currentChatItems.map((item, index) => {
                const lastItem = index === currentChatItems.length - 1;
                return (
                  <ChatItem
                    key={`${store.currentChatIndex}-${index}`}
                    question={item.question}
                    answer={item?.answer || (lastItem ? answer : "")}
                    isLoading={lastItem && !item.answer && isLoading}
                    error={item?.error || (lastItem ? error : "")}
                    voted={item.voted}
                    disableCopyHover={
                      lastItem && !item?.answer && disableCopyHover
                    }
                    index={index}
                  />
                );
              })}
            </>
          )}
        </div>
        <form className={styles.form}>
          <div className={styles.mobileTopShadow} />
          <div className={styles.formContent}>
            <div className={styles.promptWrapper}>
              <div className={cn(styles.promptHiddenEl)}>
                {prompt}
                <br style={{ lineHeight: "3px" }} />
              </div>
              <textarea
                autoFocus
                className={styles.promptInput}
                value={prompt}
                placeholder={
                  isExistingChat
                    ? isMobile
                      ? "Follow up question"
                      : "Ask a follow up question"
                    : "Ask a question..."
                }
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={(e: any) => {
                  if (
                    prompt &&
                    !disableCopyHover &&
                    e.key === "Enter" &&
                    ((isMac && e.metaKey) || (!isMac && e.ctrlKey))
                  )
                    handleSubmit(e);
                }}
              />
              <button
                className={cn(styles.runQueryBtn, {
                  [styles.inputDots]: disableCopyHover,
                })}
                disabled={!prompt || disableCopyHover}
                onClick={handleSubmit}
              >
                {disableCopyHover ? (
                  <div className={styles.loadingDots}>
                    <div className={styles.dot1} />
                    <div className={styles.dot2} />
                    <div className={styles.dot3} />
                  </div>
                ) : (
                  <RunIcon />
                )}
              </button>
              {inputFocused && prompt && !disableCopyHover ? (
                <p className={styles.subtext}>{`${ctrlKey}+Enter to send`}</p>
              ) : null}
            </div>
            {isExistingChat && (
              <div
                className={cn(styles.existingChat, {
                  [styles.hide]: inputFocused || !!prompt,
                })}
              >
                <div>
                  <span className={styles.conjunction}>or</span>
                  <button
                    onClick={startNewChat}
                    className={styles.newChatBtn}
                    type="button"
                  >
                    {isMobile ? "New question" : "Ask a new question"}
                  </button>
                  <p className={styles.subtext}>will start a new session</p>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
});

export default GPTPanel;
