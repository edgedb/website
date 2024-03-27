import {useRouter} from "next/router";

import {OverlayProvider} from "@edgedb-site/shared/hooks/useOverlayActive";
import {ThemeProvider} from "@edgedb-site/shared/hooks/useTheme";

import "@/styles/global.scss";

export const themeActivePaths: string[] = [];

export default function App({Component, pageProps}: any) {
  return (
    <OverlayProvider router={useRouter()}>
      <ThemeProvider activePaths={themeActivePaths}>
        <Component {...pageProps} />
        <div id="overlayPortalTarget" />
      </ThemeProvider>
    </OverlayProvider>
  );
}
