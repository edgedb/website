import cn from "@edgedb-site/shared/utils/classNames";
import styles from "./history.module.scss";
import { HistoryToggleIcon } from "../../icons";
import { CloseIcon } from "../../../search/icons";
import { GptChat } from "../../state";
import { observer } from "mobx-react";
import { store } from "../../state";
import { useState } from "react";

interface HistoryProps {
  collapsedDefault: boolean;
  chats: GptChat[];
  startNewChat: () => void;
  refreshInput: () => void;
  classes?: string;
}

const History = observer(
  ({
    collapsedDefault,
    chats,
    startNewChat,
    classes,
    refreshInput,
  }: HistoryProps) => {
    const [isCollapsed, setIsCollapsed] = useState(collapsedDefault);

    return (
      <div
        className={cn(classes, styles.container, {
          [styles.hideHistory]: isCollapsed,
        })}
      >
        <button
          className={cn(styles.toggleHistory, styles.collapsedToggle, {
            [styles.invisibleToggle]: !isCollapsed,
          })}
          onClick={() => setIsCollapsed(false)}
        >
          <HistoryToggleIcon />
        </button>
        <button
          className={cn(styles.mobileCloseHistory, {
            [styles.hideMobileCloseBtn]: isCollapsed,
          })}
          onClick={() => setIsCollapsed(true)}
        >
          <CloseIcon />
        </button>

        <div
          className={cn(styles.historyWrapper, {
            [styles.collapsedHistoryWrapper]: isCollapsed,
          })}
        >
          <div className={cn(styles.history, {})}>
            <div className={styles.historyHeader}>
              <button onClick={startNewChat} className={cn(styles.newChat)}>
                Ask a new question
              </button>
              <button
                className={cn(styles.toggleHistory, styles.hideToggle)}
                onClick={() => setIsCollapsed(true)}
              >
                <HistoryToggleIcon />
              </button>
            </div>
            {chats.map((chat, index) => (
              <button
                key={`${chat.title}-${index}`}
                onClick={() => {
                  refreshInput();
                  store.setCurrentChatIndex(store.chats.length - 1 - index);
                }}
                className={cn(styles.chat, {
                  [styles.activeChat]:
                    store.currentChatIndex === store.chats.length - 1 - index,
                })}
              >
                {chat.$.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

export default History;
