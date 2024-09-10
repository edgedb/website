import cn from "@edgedb-site/shared/utils/classNames";
import {GPTLogo, QuestionIcon, VoteDownIcon, VoteUpIcon} from "../../icons";
import ReactMarkdown from "react-markdown";
import {Code} from "@edgedb-site/shared/components/code";
import remarkGfm from "remark-gfm";
import {EVENT_NAME, saEvent} from "../../utils";
import {VOTING, store} from "../../state";
import {observer} from "mobx-react";
import styles from "../../gpt.module.scss";

interface ChatItemProps {
  question: string;
  answer: string | undefined;
  voted: VOTING | null;
  isLoading: boolean;
  error: string | undefined;
  disableCopyHover: boolean;
  index: number;
  classes?: string;
}

const ChatItem = observer(
  ({
    question,
    answer,
    isLoading,
    error,
    disableCopyHover,
    voted,
    index,
  }: ChatItemProps) => {
    const currentChat = store.chats[store.currentChatIndex]?.items || [];
    const isVotedUp = voted === VOTING.UP;
    const isVotedDown = voted === VOTING.DOWN;

    const vote = (eventName: EVENT_NAME) => {
      const isVotedUp = eventName === EVENT_NAME.VOTE_UP;
      currentChat[index].updateItem(
        {
          voted: isVotedUp ? VOTING.UP : VOTING.DOWN,
        },
        store.currentChatIndex
      );

      const questions = store.chats[store.currentChatIndex].items.map(
        (item) => item.question
      );

      const metadata = {
        question: questions.length > 1 ? questions : questions[0],
        ...(!isVotedUp && {answer}),
      };

      saEvent(eventName, metadata);
    };

    return (
      <div
        className={cn(styles.answerWrapper, {
          [styles.disableCopyHover]: disableCopyHover,
        })}
      >
        <div className={styles.question}>
          <QuestionIcon className={styles.questionIcon} />
          <p>{question.trim()}</p>
        </div>
        <div className={styles.response}>
          <GPTLogo className={styles.gptLogo} />
          {(answer && (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({inline, className, children}) => (
                  <Code
                    code={children.toString()}
                    language={className?.replace(/^language-/, "") ?? ""}
                    inline={inline}
                    className={styles.codeBlock}
                  />
                ),
              }}
            >
              {answer}
            </ReactMarkdown>
          )) ||
            (isLoading && (
              <div className={styles.loadingDots}>
                <div className={styles.dot1} />
                <div className={styles.dot2} />
                <div className={styles.dot3} />
              </div>
            )) ||
            (error && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {error}
              </ReactMarkdown>
            ))}
        </div>
        {!!answer && !disableCopyHover && (
          <>
            <div className={styles.votingWrapper}>
              {(!voted || isVotedUp) && (
                <button
                  onClick={() => vote(EVENT_NAME.VOTE_UP)}
                  className={styles.voteUpBtn}
                  type="button"
                  disabled={isVotedUp}
                >
                  <VoteUpIcon
                    className={cn(styles.voteUpArrow, {
                      [styles.voted]: isVotedUp,
                    })}
                  />
                </button>
              )}
              {(!voted || isVotedDown) && (
                <button
                  onClick={() => vote(EVENT_NAME.VOTE_DOWN)}
                  className={styles.voteDownBtn}
                  type="button"
                  disabled={isVotedDown}
                >
                  <VoteDownIcon
                    className={cn(styles.voteDownArrow, {
                      [styles.voted]: isVotedDown,
                    })}
                  />
                </button>
              )}
            </div>
            {voted && (
              <p className={styles.feedback}>Thank you for the feedback!</p>
            )}
          </>
        )}
      </div>
    );
  }
);

export default ChatItem;
