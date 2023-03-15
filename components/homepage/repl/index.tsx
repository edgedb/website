import {PropsWithChildren} from "react";
import {Provider, useSelector} from "react-redux";

import {CodeCellState, State} from "tutorial/types";
import CodeCell from "@/components/tutorial/codecell";

import {ThemeContext, ColourTheme} from "hooks/useTheme";

import store from "./store";

export function ReplProvider({children}: PropsWithChildren<{}>) {
  return (
    <ThemeContext.Provider
      value={{
        theme: ColourTheme.Dark,
        actualTheme: ColourTheme.Dark,
        changeTheme: () => {},
      }}
    >
      <Provider store={store}>{children}</Provider>
    </ThemeContext.Provider>
  );
}

interface ExampleReplProps {
  queryIndex: number;
}

export function ExampleRepl({queryIndex}: ExampleReplProps) {
  const cell = useSelector(
    (state: State) => state.cells.get(queryIndex)!
  ) as CodeCellState;

  return <CodeCell cell={cell} pagePath="homepage" inlineCellHeaders={true} />;
}
