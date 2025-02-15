import {promises as fs} from "fs";
import {DOMParser} from "xmldom";

import {getPaths} from "./validateLinks";

const rootPath = "./.next/server/pages/";
const publicPath = "./public/";
const basePath = "https://www.edgedb.com/";

(async function validateLinks() {
  console.log("Generating sitemap...");
  const links = await getLinks();
  const today = new Date().toISOString().slice(0, 10);
  const sitemapPath = `${publicPath}sitemap.xml`;
  await fs.writeFile(
    sitemapPath,
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...links]
  .map(
    (link) => `  <url>
    <loc>${link}</loc>
    <lastmod>${today}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`,
    "utf8"
  );

  console.log(`Generated ${sitemapPath}`);
})();

function cleanUrlPath(path: string): string {
  return path.replace(/\/?(index)?(\/|.html)?$/, "").split("#")[0] || "/";
}

async function getLinks() {
  console.log("Gathering links...");
  const [pagePaths] = await Promise.all([getPaths(rootPath, "**/*.html")]);

  if (!pagePaths.length) {
    throw new Error(
      `No page paths found, run 'yarn build' to generate static pages`
    );
  }
  const canonicals = new Set<string>(["https://www.edgedb.com"]);

  for (const pagePath of pagePaths) {
    const doc = new DOMParser().parseFromString(
      await fs.readFile(rootPath + pagePath, {encoding: "utf8"}),
      "text/html"
    );

    const links = doc.getElementsByTagName("link");
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute("rel") === "canonical") {
        canonicals.add(links[i].getAttribute("href")!);
      }
    }
  }

  return canonicals;
}

async function oldGetLinks() {
  const pagePaths = await getPaths(rootPath, "**/*.html");
  if (!pagePaths.length) {
    throw new Error(
      `No page paths found, run 'yarn build' to generate static pages`
    );
  }
  const allLinks = new Set<string>();

  console.log("Gathering links...");

  for (const pagePath of pagePaths) {
    const pageBasePath = basePath + pagePath.slice(0, -5); // remove .html ext
    const doc = new DOMParser().parseFromString(
      await fs.readFile(rootPath + pagePath, {encoding: "utf8"}),
      "text/html"
    );
    const linkEls = doc.getElementsByTagName("a");

    for (let i = 0; i < linkEls.length; i++) {
      const href = linkEls[i].getAttribute("href");
      if (!href) continue;

      const url = new URL(href, pageBasePath);
      if (!url.host.endsWith("edgedb.com")) continue;

      let cleanURL = cleanUrlPath(url.toString());
      if (cleanURL.includes("docs/v")) continue;
      if (cleanURL.includes("_next")) continue;
      cleanURL = cleanURL.replace("http://", "https://");
      cleanURL = cleanURL.replace(
        "https://edgedb.com",
        "https://www.edgedb.com"
      );
      allLinks.add(cleanURL);
    }
  }

  return allLinks;
}
