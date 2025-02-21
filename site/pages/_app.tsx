import {useRouter} from "next/router";

import posthog from "posthog-js";
import {PostHogProvider} from "posthog-js/react";

import {OverlayProvider} from "@edgedb-site/shared/hooks/useOverlayActive";
import {ThemeProvider} from "@edgedb-site/shared/hooks/useTheme";

import "@/styles/global.scss";
import {AppProps} from "next/app";
import {useEffect} from "react";

if (typeof window !== "undefined") {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.error("PostHog key is not set, analytics will not be enabled.");
  } else {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") posthog.debug();
      },
    });
  }
}

export const themeActivePaths: string[] = [];

export default function App({Component, pageProps}: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => posthog?.capture("$pageview");
    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <OverlayProvider router={useRouter()}>
        <ThemeProvider activePaths={themeActivePaths}>
          <Component {...pageProps} />
          <div id="overlayPortalTarget" />
        </ThemeProvider>
      </OverlayProvider>
    </PostHogProvider>
  );
}
