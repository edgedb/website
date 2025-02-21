import Document, {Html, Head, Main, NextScript} from "next/document";

import {themeActivePaths} from "./_app";

function PreloadFont({fn}: {fn: string}) {
  return (
    <link
      rel="preload"
      as="font"
      type="font/woff2"
      href={`/assets/fonts/${fn}.woff2`}
      crossOrigin="anonymous"
    />
  );
}

class MyDocument extends Document {
  render() {
    let tracker: JSX.Element | null = null;
    if (process.env.ENABLE_SIMPLE_ANALYTICS) {
      tracker = (
        <>
          <script
            data-collect-dnt="true"
            async
            defer
            src="https://sapi.edgedb.com/latest.js"
          ></script>
          <noscript
            dangerouslySetInnerHTML={{
              __html:
                "<img " +
                'src="https://sapi.edgedb.com/noscript.gif" ' +
                'alt="" referrerpolicy="no-referrer-when-downgrade" />',
            }}
          ></noscript>
        </>
      );
    }

    return (
      <Html lang="en" data-theme="dark">
        <Head>
          {process.env.ENABLE_SIMPLE_ANALYTICS && (
            <script>
              {`window.sa_event=window.sa_event||function(){var a=[].slice.call(arguments);window.sa_event.q?window.sa_event.q.push(a):window.sa_event.q=[a]};`}
            </script>
          )}
          {themeActivePaths.length ? (
            <script
              dangerouslySetInnerHTML={{
                __html: `
              if (location.pathname && /^(${themeActivePaths
                .map((path) => path.replace(/\//g, "\\/"))
                .join("|")})/.test(location.pathname)) {
                const theme = localStorage.getItem("colourTheme");
                console.log(theme);
                if (theme) {
                  document.documentElement.dataset.theme = theme;
                  if (theme === 'dark') {
                    document.documentElement.style.backgroundColor = '#2C2D2E';
                  }
                }
              }`,
              }}
            />
          ) : null}
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
          <link
            rel="mask-icon"
            href="/safari-pinned-tab.svg"
            color="#05a876"
          />
          <meta name="msapplication-TileColor" content="#05a876" />
          <meta name="theme-color" content="#ffffff" />

          {/* This is what the front page needs. */}
          <PreloadFont fn="edgedb-700" />
          <PreloadFont fn="roboto-mono-latin-400" />
          <PreloadFont fn="open-sans-latin-400" />
          <PreloadFont fn="open-sans-latin-400italic" />
          <PreloadFont fn="open-sans-latin-700" />
          <PreloadFont fn="open-sans-latin-800" />
        </Head>
        <body>
          <script
            dangerouslySetInnerHTML={{
              __html: `
              document.body.className +=
                (('ontouchstart' in document.documentElement)
                  ? ' touch' : ' no-touch');
              `,
            }}
          />
          <Main />
          <NextScript />
          {tracker}
        </body>
      </Html>
    );
  }
}

export default MyDocument;
