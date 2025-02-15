import {model, Model, prop, modelAction} from "mobx-keystone";
import {
  addItemToIndexDB,
  readChatsFromIndexDB,
  updateItemInIndexDB,
  updateChatTitleInIndexDB,
} from "./indexdb";

export interface Item {
  question: string;
  answer: string;
  voted: VOTING | null;
  error?: string;
}

export type UpdateItem = Partial<Item>;

export interface Chat {
  title: string;
  items: Item[];
}

export enum VOTING {
  UP = "up",
  DOWN = "down",
}

export const defaultChatName = "New chat";

@model("GptItem")
export class GptItem extends Model({
  question: prop<string>(),
  answer: prop(""),
  voted: prop<VOTING | null>(null),
  error: prop<string | undefined>(),
  index: prop<number>(),
}) {
  @modelAction
  updateItem({answer, voted, error}: UpdateItem, chatIndex: number) {
    this.answer = answer || this.answer;
    this.voted = voted || this.voted;
    this.error = error || this.error;

    updateItemInIndexDB(
      {...(answer && {answer}), ...(voted && {voted}), ...(error && {error})},
      chatIndex,
      this.index
    );
  }
}

@model("GptChat")
export class GptChat extends Model({
  title: prop<string>(),
  items: prop<GptItem[]>(() => []),
}) {
  @modelAction
  addItem(item: Item) {
    this.items.push(new GptItem({...item, index: this.items.length}));
    updateItemInIndexDB(item, store.currentChatIndex);
  }

  @modelAction
  updateTitle(title: string) {
    this.title = title;
    updateChatTitleInIndexDB(title, store.activeChatIndex);
  }
}

@model("GptStore")
class GptStore extends Model({
  currentChatIndex: prop(-1),
  activeChatIndex: prop(-1),
  chats: prop<GptChat[]>(() => []),
}) {
  @modelAction
  setCurrentChatIndex(index: number) {
    this.currentChatIndex = index;
  }

  @modelAction
  setActiveChatIndex(index: number) {
    this.activeChatIndex = index;
  }

  @modelAction
  addChat({title, items}: Chat, updateIndexDB = true) {
    const gptItems = items.map((item, index) => new GptItem({...item, index}));
    this.chats.push(new GptChat({title, items: gptItems}));
    this.setCurrentChatIndex(this.chats.length - 1);

    if (updateIndexDB) addItemToIndexDB({title, items});
  }
}

export const store = new GptStore({});

export const fillStore = async () => {
  let chats = await readChatsFromIndexDB();
  chats.forEach((chat) => store.addChat(chat, false));
  store.setCurrentChatIndex(-1);
};
