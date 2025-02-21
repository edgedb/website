import { readFileSync } from "fs";
import Link from "next/link";

import { parseIntersphinxInv } from "@edgedb-site/build-tools/sphinx/invTools";
import { remapLink } from "@edgedb-site/build-tools/xmlRenderer/remapLink";

import linkRemapping from "@/linkRemapping";

const linkRefs = parseIntersphinxInv(
  readFileSync("../.shared-cache/docs-intersphinx-objects-inv")
);

const validRelnames = new Set([
  ...linkRefs.refs.map((ref) => remapLink(`/${ref.relname}`, linkRemapping)),
  "/tutorial",
  "/easy-edgedb",
]);

export function validateLink(relname: string) {
  if (
    !/https?:\/\//.test(relname) &&
    !relname.startsWith("/") &&
    !relname.startsWith("#")
  ) {
    throw new Error(
      `invalid link url, link expected to start with '/': ${relname}`
    );
  }
  const url = new URL(relname, "https://docs.edgedb.com");
  if (
    url.origin === "https://docs.edgedb.com" &&
    url.pathname !== "/" &&
    !validRelnames.has(url.pathname)
  ) {
    throw new Error(`invalid link url: ${relname}`);
  }
  return relname;
}

export function DocsLink({
  href,
  ...props
}: React.ComponentProps<typeof Link>) {
  return <Link href={validateLink(href.toString())} {...props} />;
}
