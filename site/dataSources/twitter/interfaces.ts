export interface User {
  id: string;
  name: string;
  username: string;
  profileImageUrl: string;
}

type EntityIndices = [number, number];

export interface Tweet {
  id: string;
  text: string;
  user: User;
  entities: {
    mentions: {
      username: string;
      indices: EntityIndices;
    }[];
    hashtags: {
      tag: string;
      indices: EntityIndices;
    }[];
    urls: {
      url: string;
      displayUrl: string;
      indices: EntityIndices;
    }[];
  };
}
