import * as fs from "fs";
import {remark} from "remark";
import remarkHtml from "remark-html";
import matter from "gray-matter";
import {promisify} from "util";

const readFileAsync = promisify(fs.readFile);

const remarkProcessor = remark().use(remarkHtml, {
  sanitize: false,
});

const processMarkdown = (markdown: string) =>
  remarkProcessor.process(markdown).then((result) => result.toString());

const docs = {
  termsOfUse: "content/termsOfUse.md",
  privacyPolicy: "legal/privacyPolicy/latest.md",
  cloudTermsAndConditions: "legal/cloudTermsAndConditions/latest.md",
};

const fallbackContent = `---
modified_date: 2023-05-09
---

# Fallback legal doc

This is fallback content for a document that lives in the
https://github.com/edgedb/legal private repo. To fetch the actual document
configure the \`GITHUB_EDGEDB_CI_ACCESS_TOKEN\` environment variable with a
access token with access to the edgedb/legal repo, and then run \`yarn setup\`.
`;

export async function getLegalDoc(docName: keyof typeof docs) {
  let file: string;
  try {
    file = await readFileAsync(docs[docName], "utf8");
  } catch (e) {
    file = fallbackContent;
  }
  const {content, data} = matter(file);

  return {
    frontmatter: data,
    content: await processMarkdown(content),
  };
}
