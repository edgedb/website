import crypto from "crypto";
import { gzip } from "zlib";

import { marked } from "marked";

import type { Pipeline } from ".";
import JolrBuilder from "./jolr/builder";
import type { IndexBlock } from "./interfaces";

function compressData(data: any) {
  return new Promise<Buffer>((resolve, reject) => {
    gzip(data, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
}

export async function buildSearchIndex(
  indexer: (builder: JolrBuilder<IndexBlock>) => void,
  pipeline?: Pipeline
) {
  let log = `Created "${pipeline?.name}" search index in`;
  pipeline?.logger.time(log);

  const builder = new JolrBuilder<IndexBlock>();

  builder.addField("type", {
    publish: true,
    type: "enum",
    index: true,
    required: true,
  });
  builder.addField("target", {
    publish: true,
  });
  builder.addField("relname", {
    publish: true,
    type: "enum",
    required: true,
  });
  builder.addField("name", {
    publish: true,
    index: true,
    type: "name",
  });
  builder.addField("title", {
    publish: true,
    type: "name",
    index: true,
  });
  builder.addField("content", {
    index: true,
  });
  builder.addField("summary", {
    publish: true,
    index: true,
  });
  builder.addField("signature", {
    publish: true,
    index: true,
    customTokenizer: (str, doc) => {
      if (doc.type === "operator") {
        return str
          .split("->")[0]
          .split(/\s+/)
          .filter((opPart) => {
            if (!opPart) return false;
            return /^[^A-Za-z0-9]+$/.test(opPart);
          });
      }
      return [];
    },
  });
  builder.addField("index", {
    publish: false,
    index: true,
    type: "name",
  });
  builder.addField("version", {
    type: "enum",
    publish: true,
    index: false,
  });

  indexer(builder);

  const indexJSON = builder.toJSON();

  // Check for broken index documents
  {
    const fields = indexJSON.fields as any[];
    const signature = fields.findIndex((f) => f._name === "signature"),
      title = fields.findIndex((f) => f._name === "title"),
      name = fields.findIndex((f) => f._name === "name"),
      summary = fields.findIndex((f) => f._name === "summary"),
      content = fields.findIndex((f) => f._name === "content");

    const brokenIndexDocs = indexJSON.documents.filter(
      (doc) =>
        !(doc[signature] || doc[title] || doc[name]) ||
        !(doc[summary] || doc[content])
    );
    if (brokenIndexDocs.length > 0) {
      throw new Error(
        `${brokenIndexDocs.length} documents in search index are missing needed fields`
      );
    }
  }

  let hash = crypto
    .createHash("sha1")
    .update(JSON.stringify(indexJSON))
    .digest("hex");

  const data = JSON.stringify({
    id: hash,
    index: indexJSON,
  });

  const compressedData = await compressData(data);

  pipeline?.logger.info(
    `Created search index for "${pipeline?.name}"; ` +
      `documents count: ${indexJSON.documents.length}; ` +
      `size: ${data.length} bytes; ` +
      `compressed size: ${compressedData.byteLength} bytes`
  );

  pipeline?.logger.timeEnd(log);
  return compressedData;
}

export function summarify(text: string, maxLength = 80): string {
  let summaryLen = 0;
  let summaryWords = text.split(/\s/g);
  let broke = false;
  let summary = [];
  for (let word of summaryWords) {
    summaryLen += word.length + 1;
    if (summaryLen > maxLength) {
      broke = true;
      break;
    }
    summary.push(word);
  }

  return summary.join(" ") + (broke ? " ..." : "");
}

const htmlEntities = {
  quot: '"',
  lt: "<",
  gt: ">",
};

const unescapeHtmlEntitiesRegex = RegExp(
  `&(?:#([0-9]+)|#x([0-9a-fA-F]+)|(${Object.keys(htmlEntities).join("|")}));`,
  "g"
);

export function unescapeHtmlEntities(text: string): string {
  return text.replace(
    unescapeHtmlEntitiesRegex,
    (_, dCodePoint, hCodePoint, entityName) => {
      if (dCodePoint) {
        return String.fromCodePoint(parseInt(dCodePoint, 10));
      }
      if (hCodePoint) {
        return String.fromCodePoint(parseInt(hCodePoint, 16));
      }
      if (entityName) {
        return htmlEntities[entityName as keyof typeof htmlEntities];
      }
      return "";
    }
  );
}

const markedPlainRenderers = {
  ...[
    "code",
    "blockquote",
    "html",
    "heading",
    "hr",
    "list",
    "listitem",
    "checkbox",
    "table",
    "tablerow",
    "tablecell",
    "strong",
    "em",
    "codespan",
    "del",
    "text",
  ].reduce((renderers, type) => {
    renderers[type] = (text: any) =>
      (typeof text === "string" ? text : "") + " ";

    return renderers;
  }, {} as any),
  paragraph: (text: string) => text + " ",
  br: () => "\n",
  link: (_: any, __: any, text: string) => text,
  image: (_: any, __: any, text: string) => text,
};

marked.use({ headerIds: false, mangle: false });

export function markdownToRawText(markdown: string): string {
  return unescapeHtmlEntities(
    marked(markdown, { renderer: markedPlainRenderers })
  );
}
