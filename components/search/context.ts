import {createContext, useContext} from "react";

export const SearchContext = createContext({
  panelOpen: false,
  setPanelOpen: (open: boolean) => {},
});

export function useSearchContext() {
  return useContext(SearchContext);
}
