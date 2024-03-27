import {promises as fs} from "fs";
import * as pathUtils from "path";
import {DOMParser} from "xmldom";
import {watchFiles} from "@edgedb-site/build-tools/utils";

import redirects from "./redirects";

const rootPath = "./.next/server/pages/";
const basePath = "https://www.edgedb.com/";

const falsePositives = new Map([
  [
    "docs/guides/tutorials/graphql_apis_with_strawberry",
    ["http://localhost:5000/graphql"],
  ],
  [
    "docs/guides/tutorials/nextjs_app_router",
    ["http://localhost:3000", "http://localhost:3000/api/post"],
  ],
  ["docs/guides/tutorials/phoenix_github_oauth", ["http://localhost:4000"]],
  [
    "docs/guides/tutorials/rest_apis_with_fastapi",
    ["http://localhost:5001/docs"],
  ],
]);

async function validateLinks() {
  const [pagePaths, publicPaths, staticFilePaths] = await Promise.all([
    getPaths(rootPath, "**/*.html"),
    getPaths("./public/", "**/*"),
    getPaths("./.next/static/files/", "**/*"),
  ]);

  if (!pagePaths.length) {
    throw new Error(
      `No page paths found, run 'yarn build' to generate static pages`
    );
  }

  console.log(
    `Found ${pagePaths.length} pages, ${publicPaths.length} public files, ${staticFilePaths.length} static files, and ${redirects.length} redirects`
  );

  const pageUrls = new Set([
    ...pagePaths.map((path) => cleanUrlPath(`/${path}`)),
    ...publicPaths.map((path) => `/${path}`),
    ...staticFilePaths.map((path) =>
      cleanUrlPath(`/_next/static/files/${path}`)
    ),
  ]);

  const plainRedirects = new Map(
    redirects
      .filter((r) => !r.source.includes(":"))
      .map((r) => [r.source, r.destination])
  );
  const wildcardRedirects = redirects
    .filter((r) => r.source.includes(":"))
    .map((r) => {
      const [wildcard, multi] = r.source.match(/:\w+(\*?)/)!;
      return {
        regexp: new RegExp(
          "^" +
            r.source.replace(wildcard, `([\\w\\-${multi ? "\\/" : ""}]+)`) +
            "$"
        ),
        wildcard,
        dest: r.destination,
      };
    });

  function resolveLink(
    href: string,
    pageBasePath: string,
    isRedirect = false
  ): {url: URL; valid: boolean | null; isRedirect: boolean} {
    const url = new URL(href, pageBasePath);

    if (!(url.host === "edgedb.com" || url.host === "www.edgedb.com")) {
      return {url, valid: null, isRedirect};
    }

    const pathname = url.pathname;
    if (pageUrls.has(cleanUrlPath(pathname))) {
      return {url, valid: true, isRedirect};
    }

    if (plainRedirects.has(pathname)) {
      return resolveLink(plainRedirects.get(pathname)!, pageBasePath, true);
    }

    for (const {regexp, wildcard, dest} of wildcardRedirects) {
      const match = pathname.match(regexp);
      if (match) {
        const newHref = dest.replace(wildcard, match[1]);
        if (cleanUrlPath(newHref) === cleanUrlPath(pathname)) {
          continue;
        }
        return resolveLink(newHref, pageBasePath, true);
      }
    }

    return {url, valid: false, isRedirect};
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  let internalLinks = 0;
  const externalLinks: {[key: string]: string[]} = {};

  console.log("Checking links...");

  for (const pagePath of pagePaths) {
    const pagePathName = pagePath.slice(0, -5);
    const pageBasePath = basePath + pagePathName; // remove .html ext
    const doc = new DOMParser().parseFromString(
      await fs.readFile(rootPath + pagePath, {encoding: "utf8"}),
      "text/html"
    );
    const linkEls = doc.getElementsByTagName("a");
    for (let i = 0; i < linkEls.length; i++) {
      const href = linkEls[i].getAttribute("href");
      if (href) {
        const {url, valid, isRedirect} = resolveLink(href, pageBasePath);

        if (valid != null) {
          internalLinks++;

          if (!valid && !falsePositives.get(pagePathName)?.includes(href)) {
            errors.push(
              `\nBroken Link\npage: '${pagePathName}'\nhref: '${href}'\nlink text: '${linkEls[i].textContent}'`
            );
          }

          if (isRedirect) {
            warnings.push(
              `\nRedirected link\npage: '${pagePathName}'\nhref: '${href}'\nredirected to: '${url.pathname}'\nlink text: '${linkEls[i].textContent}'`
            );
          }

          if (/^(https?:\/\/)?(www\.)?edgedb\.com/.test(href)) {
            if (isRedirect) {
              warnings.push(
                `\nInternal link contains hostname\npage: '${pagePathName}'\nhref: '${href}'\nlink text: '${linkEls[i].textContent}'`
              );
            }
          }

          if (url.origin + "/" !== basePath) {
            warnings.push(
              `\nNon-canonical link\npage: '${pagePathName}'\nhref: '${href}'\nlink text: '${linkEls[i].textContent}'`
            );
          }
        } else {
          if (
            url.origin === "null" &&
            !(url.protocol === "mailto:" || url.protocol === "javascript:")
          ) {
            errors.push(
              `\nBroken link\npage: '${pagePathName}',\nhref: '${href}',\nlink text: '${linkEls[i].textContent}'`
            );
          } else if (
            (url.hostname === "localhost" || url.hostname === "locahost") &&
            !falsePositives.get(pagePathName)?.includes(href)
          ) {
            errors.push(
              `\nBroken link\npage: '${pagePathName}',\nhref: ${href},\nlink text: '${linkEls[i].textContent}'`
            );
          } else {
            const origin = url.origin === "null" ? url.protocol : url.origin;
            if (!externalLinks[origin]) {
              externalLinks[origin] = [];
            }
            externalLinks[origin].push(url.href);
          }
        }
      }
    }
  }

  console.log(
    `Checked ${internalLinks} internal links${
      !errors.length && !warnings.length ? ": No errors found" : "..."
    }\n`
  );

  if (errors.length) {
    console.log(`${errors.length} errors found:`);
    console.log(errors.join("\n") + "\n");
  }
  if (warnings.length) {
    console.log(`${warnings.length} warnings found:`);
    console.log(warnings.join("\n") + "\n");
  }

  console.log(
    `Found links to ${Object.keys(externalLinks).length} external origins:`
  );
  for (const [origin, links] of Object.entries(externalLinks)) {
    console.log(`${origin} (${links.length} links)`);
  }

  if (errors.length) {
    console.log("\n");
    throw new Error("Link errors were found");
  }
}

if (require.main === module) {
  validateLinks();
}

function cleanUrlPath(path: string): string {
  return path.replace(/\/?(index)?(\/|.html)?$/, "") || "/";
}

export function getPaths(rootPath: string, glob: string) {
  return new Promise<string[]>((resolve) => {
    const pagePaths: string[] = [];

    const dispose = watchFiles(
      rootPath + glob,
      (type, path) => {
        if (type === "add") {
          pagePaths.push(pathUtils.relative(rootPath, path));
        }
      },
      () => {
        dispose();
        resolve(pagePaths);
      }
    );
  });
}
