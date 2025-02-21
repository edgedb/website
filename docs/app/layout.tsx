import type { Metadata } from "next";
import "./globals.scss";

import { ThemeProvider } from "@edgedb-site/shared/hooks/useTheme";
import { OverlayProvider } from "@edgedb-site/shared/hooks/useOverlayActive";
import { CodeTabContextProvider } from "@edgedb-site/shared/components/code/tabs";
import { DocVersionProvider } from "@/hooks/docVersion";

import { PageHeader } from "@/components/pageHeader";
import { Search } from "@/components/search";

import { AskAI } from "@/components/gpt";
import { PHProvider } from './providers'

export const metadata: Metadata = {
  title: {
    template: "%s | EdgeDB Docs",
    default: "EdgeDB Docs",
  },
  description: "EdgeDB Docs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
          const theme = localStorage.getItem("colourTheme");
          if (theme) {
            document.documentElement.dataset.theme = theme;
          }
        `,
          }}
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#05a876" />
        <meta name="msapplication-TileColor" content="#05a876" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <PHProvider>
        <body>
            <ThemeProvider>
              <OverlayProvider>
                <CodeTabContextProvider>
                  <DocVersionProvider>
                    <PageHeader />
                    <Search />
                    <AskAI />
                    {children}
                  </DocVersionProvider>
                </CodeTabContextProvider>
              </OverlayProvider>
            </ThemeProvider>
        </body>
      </PHProvider>
    </html>
  );
}
