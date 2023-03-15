import {resolve as resolvePath, join as joinPath} from "path";
import fs from "fs-extra";

import {execAsync} from "./utils";

import {transformXML, XMLNode} from "@edgedb/site-build-tools/xmlutils";

export async function buildGoDocs(docsPath: string, outDir: string) {
  const [doc, typesDoc] = await Promise.all([
    await getDocsData(docsPath),
    await getDocsData(docsPath, "/internal/edgedbtypes"),
  ]);

  if (doc.name !== "document" || typesDoc.name !== "document") {
    throw new Error("No 'document' node found");
  }

  await Promise.all([
    fs.outputFile(resolvePath(outDir, "index.rst"), renderIndexPage(doc)),
    fs.outputFile(
      resolvePath(outDir, "api.rst"),
      renderAPIPage(
        "API",
        doc,
        new Set(
          typesDoc.lookupChildren("type").map((node) => node.attrs.name!)
        )
      )
    ),
    fs.outputFile(
      resolvePath(outDir, "types.rst"),
      renderAPIPage("Datatypes", typesDoc)
    ),
  ]);
}

function renderIndexPage(doc: XMLNode): string {
  let rst = `
================
EdgeDB Go Driver
================
`;

  rst += `

.. toctree::
   :maxdepth: 3
   :hidden:

   api
   types

`;

  const overview = doc.lookupChild("overview");
  if (overview) {
    const content = overview.lookupChild("content");
    if (content) {
      rst += content.children.flatMap(processBlockNode).join("\n");
    }
    const example = overview.lookupChild("example");
    if (example) {
      rst += `

Usage Example
-------------

`;
      rst += example.children.flatMap(processBlockNode).join("\n");
    }
  }

  return rst;
}

function renderAPIPage(
  title: string,
  doc: XMLNode,
  excludeTypes?: Set<string>
): string {
  let rst = `
${title}
${"-".repeat(title.length)}`;

  const types = doc.lookupChildren("type");
  for (const type of types) {
    if (excludeTypes?.has(type.attrs.name!)) {
      continue;
    }

    rst += `


*type* ${type.attrs.name}
-------${"-".repeat(type.attrs.name!.length)}`;
    rst += type.children.flatMap(processBlockNode).join("\n");

    const consts = type.lookupChildren("const");
    for (const constNode of consts) {
      rst += "\n\n";
      rst += constNode.children.flatMap(processBlockNode).join("\n");
    }

    const functions = type.lookupChildren("function");
    for (const func of functions) {
      rst += `

*function* ${func.attrs.name}
...........${".".repeat(func.attrs.name!.length)}

`;
      rst += func.children.flatMap(processBlockNode).join("\n");
    }

    const methods = type.lookupChildren("method");
    for (const method of methods) {
      rst += `

*method* ${method.attrs.name}
.........${".".repeat(method.attrs.name!.length)}

`;
      rst += method.children.flatMap(processBlockNode).join("\n");
    }
  }

  return rst;
}

function processBlockNode(node: XMLNode | string): string[] {
  if (typeof node === "string") {
    return [];
  }

  if (node.name === "p") {
    if (node.getText().trim().startsWith("# ")) {
      const modText = node.getText().trim().slice(2);
      return [modText, "-".repeat(modText.length)];
    }
  }
  switch (node.name) {
    case "overview":
      return node.children.flatMap(processBlockNode);
    case "p":
      return ["", node.children.flatMap(processInlineNode).join(""), ""];
    case "h2":
    case "h3": {
      const heading = node.children.flatMap(processInlineNode).join("");
      const underline = ["=", "-", "."][
        Number(node.name.slice(-1)) - 2
      ].repeat(heading.length);
      return [heading, underline];
    }
    case "pre":
      return [
        `.. code-block:: ${node.attrs.lang ?? "go"}`,
        "",
        ...indentLines(node.getAllText(true).split("\n"), 4),
      ];
  }
  return [];
}

function processInlineNode(node: XMLNode | string): string {
  if (typeof node === "string") {
    // Workaround lone "*" sphinx error, like in
    //   "OptionalBigInt is an optional *big.Int."
    node = node.replace(/\\\*|(\*)/g, "\\*");
    return node;
  }
  switch (node.name) {
    case "a":
      return `\`${node.children.flatMap(processInlineNode).join("")} <${
        node.attrs.href
      }>\`_`;
  }
  return "";
}

function indentLines(lines: string[], indent: number): string[] {
  return lines.map((line) => " ".repeat(indent) + line);
}

function debugNode(node: XMLNode) {
  console.log(
    JSON.stringify(node, (key, val) => (key === "_parent" ? null : val), 2)
  );
}

async function getDocsData(docsPath: string, urlSuffix = "") {
  let rawXml = await execAsync(
    `$(go env GOPATH)/bin/godoc -templates ${resolvePath(
      __dirname,
      "./goTemplates"
    )} -url ${joinPath("pkg/github.com/edgedb/edgedb-go", urlSuffix)}`,
    undefined,
    {encoding: "utf8", cwd: resolvePath(docsPath), shell: true}
  );

  rawXml = rawXml.slice(rawXml.indexOf("\n"));
  const finalXml = transformXML(rawXml, false);
  return finalXml;
}
