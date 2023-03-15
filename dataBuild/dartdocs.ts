import {
  resolve as resolvePath,
  join as joinPath,
  basename,
  extname,
} from "path";
import fs from "fs-extra";

import * as cheerio from "cheerio";
import {isText, isTag} from "domhandler";

import {execAsync} from "./utils";

const pageRefs = [
  {page: "api", type: "function", name: "createClient"},
  {page: "api", type: "class", name: "Client"},
  {page: "api", type: "class", name: "Options"},
  {page: "api", type: "class", name: "Session"},
  {page: "api", type: "class", name: "RetryOptions"},
  {page: "api", type: "class", name: "TransactionOptions"},
  {page: "datatypes", type: "class", name: "Range"},
  {page: "datatypes", type: "class", name: "ConfigMemory"},
];

export async function buildDartDocs(repoPath: string, outDir: string) {
  const outputPath = "./.build-cache/_dartdoc";

  console.log(
    await execAsync(
      fs.existsSync("./dart-sdk") ? "./dart-sdk/bin/dart" : "dart",
      ["doc", `--output=${outputPath}`, repoPath]
    )
  );

  const docs = await generateFileMapping(outputPath);

  await Promise.all([
    processIndexPage(outputPath, outDir),
    processClientPage(outputPath, outDir),
    processAPIPage(outDir, docs.api),
    processDatatypesPage(outDir, docs.datatypes),
    processCodegenPage(outputPath, outDir),
  ]);
}

const fileRefMapping = new Map<string, string>();

type refData = {
  name: string;
  type: string;
  doc: Promise<cheerio.CheerioAPI>;
  sourcePath: string;
};

async function generateFileMapping(basePath: string) {
  const docs: {
    [key: string]: refData[];
  } = {
    api: [],
    datatypes: [],
  };

  for (const item of pageRefs) {
    const pagePath = `edgedb/${item.name}${
      item.type === "class" ? "-class" : ""
    }.html`;
    fileRefMapping.set(pagePath, `edgedb-dart-${item.name}`);

    docs[item.page].push({
      name: item.name,
      type: item.type,
      doc: parseHtmlFile(joinPath(basePath, pagePath)),
      sourcePath: pagePath,
    });

    if (item.type === "class") {
      const fieldDocs = await fs.readdir(
        joinPath(basePath, "edgedb", item.name)
      );
      for (const docName of fieldDocs) {
        const docPath = joinPath("edgedb", item.name, docName);
        fileRefMapping.set(
          docPath,
          `edgedb-dart-${item.name}-${basename(docPath, extname(docPath))}`
        );

        docs[item.page].push({
          name: basename(docName, extname(docPath)),
          type: "field",
          doc: parseHtmlFile(joinPath(basePath, docPath)),
          sourcePath: docPath,
        });
      }
    }
  }

  return docs as {api: refData[]; datatypes: refData[]};
}

async function processIndexPage(basePath: string, outDir: string) {
  const doc = await parseHtmlFile(joinPath(basePath, "index.html"));

  const page = nodeToRst(doc("#dartdoc-main-content section.desc")[0]).split(
    "Contributing\n------------"
  )[0];

  const [heading, content] = page.split(/(?<=={3,})\n/);

  const indexPage = `${heading}

.. _ref_client_dart:

.. toctree::
  :maxdepth: 3
  :hidden:

  client
  api
  datatypes
  codegen

${content}`;

  await fs.outputFile(resolvePath(outDir, "index.rst"), indexPage);
}

async function processClientPage(basePath: string, outDir: string) {
  const doc = await parseHtmlFile(
    joinPath(basePath, "edgedb/edgedb-library.html")
  );

  const page =
    `
Client
======

:edb-alt-title: Client Library

` + nodeToRst(doc("#dartdoc-main-content section.desc")[0]);

  await fs.outputFile(resolvePath(outDir, "client.rst"), page);
}

async function renderRefItems(items: refData[]) {
  let page = "";

  for (const item of items) {
    const doc = await item.doc;
    switch (item.type) {
      case "function": {
        page +=
          `
.. _${fileRefMapping.get(item.sourcePath)}:

*function* ${item.name}()
-----------${"-".repeat(item.name.length)}--

.. code-block:: dart

    ${indent(
      sigToString(
        doc("#dartdoc-main-content section.multi-line-signature")[0]
      ),
      4
    )}

` + nodeToRst(doc("#dartdoc-main-content section.desc")[0]);
        break;
      }
      case "class": {
        const content = doc("#dartdoc-main-content section.desc")[0];

        page += `
.. _${fileRefMapping.get(item.sourcePath)}:

*class* ${item.name}
--------${"-".repeat(item.name.length)}\n\n`;
        if (content) {
          page += nodeToRst(content);
        } else {
        }
        break;
      }
      case "field": {
        const content = doc("#dartdoc-main-content section.desc")[0];

        const nameNode = doc("#dartdoc-main-content h1 > span")[0];
        let name = nodeListToRst(nameNode.children);
        let kind = nameNode.attribs.class.replace(/^kind-/, "");

        if (kind === "method" && name.startsWith("operator")) {
          kind = "operator";
          name = name
            .replace(/^operator/, "")
            .replace(/method$/, "")
            .trim();
        }

        const heading = `*${kind}* \`\`${
          kind === "method" || kind === "property" ? "." : ""
        }${name.replace(/\\\*|(\*)/g, "\\*")}${
          kind === "method" || kind === "constructor" ? "()" : ""
        }\`\``;
        page += `\n.. _${fileRefMapping.get(
          item.sourcePath
        )}:\n\n${heading}\n${".".repeat(heading.length)}\n`;
        if (
          kind === "method" ||
          kind === "constructor" ||
          kind === "operator"
        ) {
          page += `

.. code-block:: dart

    ${indent(
      sigToString(
        doc("#dartdoc-main-content section.multi-line-signature")[0]
      ),
      4
    )}

`;
        }
        if (kind === "property") {
          const code = nodeListToRst(
            doc("#dartdoc-main-content section.source-code pre code")[0]
              .children
          )
            .split(/{\n|=/)[0]
            .replace("@override", "")
            .trim();
          page += `

.. code-block:: dart

    ${code}

`;
        }
        if (content) {
          page += nodeToRst(content);
        } else {
        }
      }
    }
  }

  return page;
}

async function processAPIPage(outDir: string, items: refData[]) {
  let page = `
API
===

:edb-alt-title: Client API Reference

`;

  page += await renderRefItems(items);

  await fs.outputFile(resolvePath(outDir, "api.rst"), page);
}

async function processDatatypesPage(outDir: string, items: refData[]) {
  let page = `
Datatypes
=========

:edb-alt-title: Custom Datatypes

`;

  page += await renderRefItems(items);

  await fs.outputFile(resolvePath(outDir, "datatypes.rst"), page);
}

async function processCodegenPage(basePath: string, outDir: string) {
  const doc = await parseHtmlFile(
    joinPath(basePath, "edgeql_codegen/edgeql_codegen-library.html")
  );

  const page =
    `
Codegen
=======

:edb-alt-title: EdgeQL Codegen Library

` + nodeToRst(doc("#dartdoc-main-content section.desc")[0]);

  await fs.outputFile(resolvePath(outDir, "codegen.rst"), page);
}

async function parseHtmlFile(path: string) {
  const file = await fs.readFile(path, {encoding: "utf8"});

  return cheerio.load(file);
}

function nodeListToRst(nodes: cheerio.Node[]): string {
  return nodes.map((child) => nodeToRst(child as cheerio.Element)).join("");
}
function nodeToRst(node: cheerio.Node, skipEmptyText = false): string {
  if (isText(node)) {
    return skipEmptyText ? node.data.trim() : node.data;
  }
  if (isTag(node)) {
    switch (node.name) {
      case "div":
      case "section":
        return node.children
          .map((child) => nodeToRst(child as cheerio.Element, true))
          .filter((frag) => frag !== "")
          .join("\n");
      case "h1":
      case "h2":
      case "h3":
        const heading = nodeListToRst(node.children).trim();
        return `${heading}\n${{h1: "=", h2: "-", h3: "."}[node.name].repeat(
          heading.length
        )}\n`;
      case "p":
        return nodeListToRst(node.children) + "\n";
      case "a":
        let href = node.attribs.href;
        const label = nodeListToRst(node.children).replace(/\<|\>/g, "\\$&");

        try {
          const parsedUrl = new URL(href);
          if (/^(www\.)?edgedb\.com/.test(parsedUrl.hostname)) {
            href = parsedUrl.pathname + parsedUrl.hash;
          }
        } catch {
          // href is relative
          const path = href.replace(/\.\.\//g, "");
          const ref = fileRefMapping.get(path);
          if (ref) {
            return `:ref:\`${label} <${ref}>\``;
          } else {
            href = `https://pub.dev/documentation/edgedb/latest/${path}`;
          }
        }
        return `\`${label} <${href}>\`__`;
      case "code":
        return `\`\`${nodeListToRst(node.children)}\`\``;
      case "em":
        return `*${nodeListToRst(node.children)}*`;
      case "span":
        return nodeListToRst(node.children);
      case "pre":
        const code = nodeListToRst(
          (node.children[0] as cheerio.Element).children
        );
        return `.. code-block:: ${node.attribs.class.replace(
          /^language-/,
          ""
        )}\n\n    ${indent(code, 4)}`;
      case "blockquote":
        const quote = nodeListToRst(node.children);
        if (/^\s*note: /i.test(quote)) {
          return `.. note::\n    ${indent(
            quote.replace(/^(\s*)note: /i, "$1"),
            4
          )}`;
        }
        return `.. pull-quote::\n    ${indent(quote, 4)}`;
      case "ul":
        const list = node.children.map((child) => {
          if (isTag(child)) {
            if (child.name !== "li") {
              throw Error('expected only "li" tags in "ul"');
            }
            return `* ${indent(
              nodeListToRst(child.children)
                .split("\n")
                .map((line) => line.trimStart())
                .join("\n"),
              2
            )}`;
          }
        });
        return list.join("\n");
      case "table":
        const rows = node.children.flatMap((child) =>
          isTag(child) ? child.children : []
        );

        return `.. list-table::\n  :header-rows: 1\n\n${rows
          .map((row) => {
            if (!isTag(row) || row.name !== "tr") {
              throw Error('expected "tr" tag');
            }
            return `  * ${row.children
              .map((child) =>
                isTag(child) ? `- ${nodeListToRst(child.children)}` : ""
              )
              .join("\n    ")}`;
          })
          .join("\n")}\n`;
      default:
        break;
    }
  }
  return "";
}

function sigToString(node: cheerio.Node): string {
  const code = _sigToString(node, true)
    .trim()
    .replace(/^@override|override$/g, "")
    .trim();

  return code.includes("\n") ? code.replace(/\)$/, "\n)") : code;
}

function _sigToString(node: cheerio.Node, linebreakParams: boolean): string {
  if (isText(node)) {
    return node.data.replace(/\n/, "");
  }
  if (isTag(node)) {
    return (
      (linebreakParams && node.attribs.class === "parameter" ? "\n  " : "") +
      node.children
        .map((child) =>
          _sigToString(
            child,
            linebreakParams && node.attribs.class !== "parameter"
          )
        )
        .join("") +
      (node.attribs.class === "returntype" ? " " : "")
    );
  }
  return "";
}

function indent(text: string, indent: number): string {
  return text.split("\n").join("\n" + " ".repeat(indent));
}
