import {OverlayProvider} from "hooks/useOverlayActive";
import {ThemeProvider} from "hooks/useTheme";

import "@/styles/global.scss";

export default function App({Component, pageProps}: any) {
  return (
    <OverlayProvider>
      <ThemeProvider>
        <Component {...pageProps} />
        <div id="overlayPortalTarget" />
      </ThemeProvider>
    </OverlayProvider>
  );
}
