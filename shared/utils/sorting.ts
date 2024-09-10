export const sortByName = <T extends {name: string}>(arr: T[]) =>
  arr.sort((a, b) => (a.name > b.name ? 1 : -1));

export const sortByDate = <T extends {date: string}>(arr: T[]) =>
  arr.sort((a, b) => (a.date < b.date ? 1 : -1));
