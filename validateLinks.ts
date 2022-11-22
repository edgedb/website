import {promises as fs} from "fs";
import * as pathUtils from "path";
import {DOMParser} from "xmldom";
import {watchFiles} from "@edgedb/site-build-tools/utils";

import redirects from "./redirects.json";

const rootPath = "./.next/server/pages/";
const basePath = "https://www.edgedb.com/";

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
    ...redirects.map((redirect) => redirect.source),
  ]);

  const errors: string[] = [];
  const warnings: string[] = [];

  let internalLinks = 0;
  const externalLinks: {[key: string]: string[]} = {};

  console.log("Checking links...");

  for (const pagePath of pagePaths) {
    const pageBasePath = basePath + pagePath.slice(0, -5); // remove .html ext
    const doc = new DOMParser().parseFromString(
      await fs.readFile(rootPath + pagePath, {encoding: "utf8"}),
      "text/html"
    );
    const linkEls = doc.getElementsByTagName("a");
    for (let i = 0; i < linkEls.length; i++) {
      const href = linkEls[i].getAttribute("href");
      if (href) {
        const url = new URL(href, pageBasePath);

        if (url.host.endsWith("edgedb.com")) {
          internalLinks++;

          const pathname = cleanUrlPath(url.pathname);
          if (!pageUrls.has(pathname)) {
            errors.push(
              `\nBroken Link\npage: '${pagePath.slice(
                0,
                -5
              )}'\nhref: '${href}'\ntext: '${linkEls[i].textContent}'`
            );
          }

          if (url.origin + "/" !== basePath) {
            warnings.push(
              `\nNon-canonical link\npage: '${pagePath.slice(
                0,
                -5
              )}'\nhref: '${href}'\ntext: '${linkEls[i].textContent}'`
            );
          }
        } else {
          if (url.origin === "null" && url.protocol !== "mailto:") {
            errors.push(
              `Broken link on page: '${pagePath.slice(
                0,
                -5
              )}', href: '${href}', link text: '${linkEls[i].textContent}'`
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
