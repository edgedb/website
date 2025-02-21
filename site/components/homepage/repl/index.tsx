import {PropsWithChildren} from "react";

import {
  TutorialPageStateProvider,
  TutorialStateStoreProvider,
} from "@edgedb-site/shared/tutorial/state";
import {CodeCell} from "@edgedb-site/shared/components/tutorial/codecell";

import {ThemeContext, ColourTheme} from "@edgedb-site/shared/hooks/useTheme";

import data from "@/build-cache/homepage/replData.json";

export function ReplProvider({children}: PropsWithChildren<{}>) {
  return (
    <ThemeContext.Provider
      value={{
        theme: ColourTheme.Dark,
        actualTheme: ColourTheme.Dark,
        changeTheme: () => {},
      }}
    >
      <TutorialStateStoreProvider>
        <TutorialPageStateProvider
          pageId="homepage"
          codeCells={data.queries.map((query) => ({
            kind: "edgeql",
            text: query,
          }))}
          prefetchedData={data.prefetchedResults as any}
          protocolVersion={data.protocolVersion as any}
          defaultMode="json"
        >
          {children}
        </TutorialPageStateProvider>
      </TutorialStateStoreProvider>
    </ThemeContext.Provider>
  );
}

interface ExampleReplProps {
  queryIndex: number;
}

export function ExampleRepl({queryIndex}: ExampleReplProps) {
  return <CodeCell cellId={queryIndex} inlineCellHeaders={true} />;
}
