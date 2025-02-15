import {UpdateItem, Chat} from "./state";

const GPT_DB = "gpt-database";
const GPT_STORE = "chats";

// todo handle version updates
let version = 1;

export const initDB = (): Promise<boolean> => {
  if (!window.indexedDB)
    throw new Error("Your browser doesn't support IndexedDB.");

  return new Promise((resolve) => {
    let openRequest = indexedDB.open(GPT_DB, version);

    openRequest.onupgradeneeded = () => {
      let db = openRequest.result;

      // if the data object store doesn't exist, create it
      if (!db.objectStoreNames.contains(GPT_STORE))
        db.createObjectStore(GPT_STORE, {keyPath: "id", autoIncrement: true});
    };

    openRequest.onsuccess = () => resolve(true);
    openRequest.onerror = () => {
      console.error(openRequest.error?.message);
      resolve(false);
    };
  });
};

export const addItemToIndexDB = (data: Chat): Promise<boolean> => {
  return new Promise((resolve) => {
    let openRequest = indexedDB.open(GPT_DB, version);

    openRequest.onsuccess = () => {
      let db = openRequest.result;
      const tx = db.transaction(GPT_STORE, "readwrite");
      const store = tx.objectStore(GPT_STORE);
      const addRequest = store.add(data);

      addRequest.onsuccess = () => resolve(true);

      addRequest.onerror = () => {
        console.error(openRequest.error?.message);
        resolve(false);
      };
    };

    openRequest.onerror = () => {
      console.error(openRequest.error?.message);
      resolve(false);
    };
  });
};

export const updateChatTitleInIndexDB = (title: string, chatIndex: number) => {
  return new Promise((resolve) => {
    let openRequest = indexedDB.open(GPT_DB, version);

    openRequest.onsuccess = () => {
      let db = openRequest.result;
      const tx = db.transaction(GPT_STORE, "readwrite");
      const store = tx.objectStore(GPT_STORE);
      const getRequest = store.get(chatIndex + 1);

      getRequest.onsuccess = () => {
        let item = getRequest.result;
        item.title = title;

        const updateRequest = store.put(item);

        updateRequest.onsuccess = () => resolve(true);

        updateRequest.onerror = () => {
          console.error(updateRequest.error?.message);
          resolve(false);
        };
      };

      getRequest.onerror = () => {
        console.error(openRequest.error?.message);
        resolve(false);
      };
    };

    openRequest.onerror = () => {
      console.error(openRequest.error?.message);
      resolve(false);
    };
  });
};

// Update item in existing chat.
export const updateItemInIndexDB = (
  data: UpdateItem,
  chatIndex: number,
  index?: number
): Promise<boolean> => {
  return new Promise((resolve) => {
    let openRequest = indexedDB.open(GPT_DB, version);

    openRequest.onsuccess = () => {
      let db = openRequest.result;
      const tx = db.transaction(GPT_STORE, "readwrite");
      const store = tx.objectStore(GPT_STORE);
      const getRequest = store.get(chatIndex + 1);

      getRequest.onsuccess = () => {
        let item = getRequest.result;

        if (index !== undefined) {
          item.items[index] = {...item.items[index], ...data};
        } else {
          item.items = [...item.items, data];
        }

        const updateRequest = store.put(item);

        updateRequest.onsuccess = () => resolve(true);

        updateRequest.onerror = () => {
          console.error(updateRequest.error?.message);
          resolve(false);
        };
      };

      getRequest.onerror = () => {
        console.error(openRequest.error?.message);
        resolve(false);
      };
    };

    openRequest.onerror = () => {
      console.error(openRequest.error?.message);
      resolve(false);
    };
  });
};

export const readChatsFromIndexDB = (): Promise<Chat[]> => {
  return new Promise((resolve) => {
    let openRequest = indexedDB.open(GPT_DB, version);

    openRequest.onsuccess = () => {
      let db = openRequest.result;
      const tx = db.transaction(GPT_STORE, "readwrite");
      const store = tx.objectStore(GPT_STORE);
      const getRequest = store.getAll();

      getRequest.onsuccess = () => resolve(getRequest.result);

      getRequest.onerror = () => {
        console.error(getRequest.error?.message);
        resolve([]);
      };
    };

    openRequest.onerror = () => {
      console.error(openRequest.error?.message);
      resolve([]);
    };
  });
};
