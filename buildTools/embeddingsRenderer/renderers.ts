import {
  EmbeddingsRenderer,
  EmbeddingsRendererMap,
  renderChildren,
  renderNode,
} from ".";
import { buildSig } from "@edgedb-site/build-tools/sphinx/buildSig";

import { toAbsoluteURI } from "../utils";

function toTitleCase(str: string) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

const nullRenderer = () => "";

const noteRenderer: EmbeddingsRenderer = (node, ctx) => {
  return (
    `${toTitleCase(node.name)}: ${renderChildren(node.children, ctx)}`
      .trim()
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n") + "\n\n"
  );
};

const codeTabNames: { [key: string]: string } = {
  edgeql: "EdgeQL",
  js: "JS",
  typescript: "TypeScript",
  csharp: "C#",
  cs: "C#",
  fsharp: "F#",
};

export const renderers: EmbeddingsRendererMap = {
  target: nullRenderer,
  comment: nullRenderer,
  transition: nullRenderer,
  index: nullRenderer,
  todo_node: nullRenderer,
  image: nullRenderer,
  raw: nullRenderer,
  compound: nullRenderer,
  figure: nullRenderer,
  container: nullRenderer,

  inline: (node) => node.getText(),

  literal: (node) => "`" + node.getText() + "`",

  literal_strong: (node) => `__${node.getText()}__`,

  literal_emphasis: (node) => `_${node.getText()}_`,

  strong: (node) => `__${node.getText()}__`,

  emphasis: (node) => `_${node.getText()}_`,

  title: (node, ctx) => {
    let title: string;
    if (node.attrs["edb-alt-title"]) {
      title = node.attrs["edb-alt-title"];
    } else if (node.children && node.children.length > 1) {
      title = `${renderChildren(node.children, ctx)}`;
    } else {
      title = node.getAllText();
    }
    return `# ${title}\n\n`;
  },

  paragraph: (node, ctx) => `${renderChildren(node.children, ctx)}\n\n`,

  rubric: (node, ctx) => `#### ${node.getAllText()}\n\n`,

  term: (node, ctx) => `${renderChildren(node.children, ctx)}\n`,

  definition: (node, ctx) => `${renderChildren(node.children, ctx)}\n`,

  glossary: (node, ctx) => `${renderChildren(node.children, ctx)}\n`,

  section: (node, ctx) => {
    return renderChildren(node.children, {
      ...ctx,
      renderers: {
        ...ctx.renderers,
        section: nullRenderer,
        desc: nullRenderer,
      },
    });
  },

  literal_block: (node, ctx) => {
    if (node.attrs["version_lt"]) {
      // Ignore if code block is versioned, we only need to render the latest
      // code block version
      return "";
    }
    return (
      "```" + `${node.attrs.language}\n${node.getText(true)}\n` + "```\n\n"
    );
  },

  reference: (node, ctx) => {
    const href =
      node.attrs.internal?.toLowerCase() === "true"
        ? "https://edgedb.com" +
          (node.attrs.refid
            ? `${ctx.relname}#${node.attrs.refid}`
            : toAbsoluteURI(node.attrs.refuri!, ctx))
        : node.attrs.refuri;

    return `[${renderChildren(node.children, ctx)}](${href})`;
  },

  note: noteRenderer,
  warning: noteRenderer,
  important: noteRenderer,

  bullet_list: (node, ctx) => `${renderChildren(node.children, ctx)}\n`,

  enumerated_list: (node, ctx) => `${renderChildren(node.children, ctx)}\n`,

  list_item: (node, ctx, index) => {
    let prefix = "*";
    if (node.parent?.name === "enumerated_list" && index) prefix = `${index}.`;
    return `${prefix} ${renderChildren(node.children, ctx)}\n`;
  },

  field_list: (node, ctx) => {
    if (
      node.parent?.parent?.attrs.domain === "py" ||
      node.parent?.parent?.attrs.domain === "js" ||
      node.parent?.parent?.attrs.domain === "dn"
    ) {
      return `${renderChildren(node.children, ctx)}\n`;
    }
    return nullRenderer();
  },

  field: (node, ctx) => {
    const fieldName = node.lookupChild("field_name");
    const fieldBody = node.lookupChildren("field_body");

    let name = fieldName ? `##### ${fieldName?.children[0]}` : "";

    let body = "";

    for (let item of fieldBody)
      body += renderChildren(item.children, ctx) + "\n";

    return `${name}\n\n${body}\n\n`;
  },

  definition_list: (node, ctx) => {
    let items = node.lookupChildren("definition_list_item");
    let dl: string = "";
    for (let item of items.values()) {
      let term = item.lookupChild("term")!;
      let def = item.lookupChild("definition")!;
      dl = dl + `${renderNode(term, ctx)}\n: ${renderNode(def, ctx)}\n`;
    }
    return dl;
  },

  desc: (node, ctx) => {
    const { objtype, domain } = node.attrs;
    const sigNodes = node.lookupChildren("desc_signature");
    const contentNode = node.lookupChild("desc_content");

    let signature = "";
    let anno: string | null = null;

    const descRefId = sigNodes[0]?.attrs.ids?.split(" ")[0];
    let titleSig = descRefId
      ? ctx.pageAttrs.get("descRefs")?.[descRefId] ?? null
      : null;

    let sigs: string[] = [];
    for (let sigNode of sigNodes) {
      let sig = sigNode.attrs["eql-signature"] || sigNode.attrs["eql-name"];
      let fullname: string | undefined | null = sig;

      if (!sig) {
        [sig, anno, fullname] = buildSig(objtype!, domain!, sigNode);
      }

      if (fullname && !titleSig && sigs.length === 0) {
        if (domain === "js" && objtype === "attribute") {
          fullname = fullname.split(":")[0];
        }
        if (objtype === "constraint" || objtype === "function") {
          fullname = fullname.split(/[(\s]/)[0];
        }
        titleSig =
          fullname +
          (objtype && ["function", "coroutine", "method"].includes(objtype)
            ? "()"
            : "");
      }

      if (sig) {
        sig = sig.replace(/\s+/g, " ");
        sigs.push(sig);
        if (!signature) signature = "```" + `${domain}\n`;
        signature += `${sig}\n`;
      }
    }

    if (titleSig && sigs.length === 1 && sigs[0] === titleSig) {
      sigs = [];
    }

    if (!titleSig) {
      titleSig = sigs.shift();
    }

    signature += "```\n\n";

    let content = "";

    if (contentNode) {
      content = `${renderChildren(contentNode.children, {
        ...ctx,
        renderers: {
          ...ctx.renderers,
          desc: nullRenderer,
        },
      })}\n`;
    }

    return (
      `# ${toTitleCase(objtype!)}: ${titleSig}` + "\n\n" + signature + content
    );
  },

  table: (node, ctx) => {
    if (node.attrs.classes?.includes("funcoptable")) {
      if (!ctx.pageAttrs.has("descRefs")) {
        ctx.pageAttrs.set("descRefs", {});
      }
      for (const refNode of node.lookupAllChildren("reference")) {
        const descRefId = refNode.attrs.refid;
        const literalNode = refNode.lookupChild("literal");

        if (descRefId && literalNode) {
          ctx.pageAttrs.get("descRefs")[descRefId] = literalNode.getText(true);
        }
      }
    }

    const group = node.lookupChildren("tgroup");

    let markdown = "";

    for (let item of group) {
      const colspec = item.lookupChildren("colspec");

      const thead = item.lookupChild("thead");
      const tbody = item.lookupChild("tbody");

      if (colspec) {
        if (thead && thead.children) {
          markdown +=
            "|" +
            `${renderChildren(thead.children, ctx)}`
              .trim()
              .split("\n\n\n")
              .join(" | ") +
            " |\n";
        } else {
          for (let i = 0; i < colspec.length; i++) {
            markdown += `|   `;
          }
          markdown += "|\n";
        }

        for (let i = 0; i < colspec.length; i++) {
          markdown += `| - `;
        }
        markdown += "|\n";

        if (tbody) {
          markdown +=
            `${renderChildren(tbody.children, ctx)}`
              .trim()
              .split("\n\n\n\n")
              .map((row) => "|" + row.trim().split("\n\n\n").join(" | ") + "|")
              .join("\n") + "\n";
        }
      }
    }

    return markdown + "\n\n";
  },

  row: (node, ctx) => `${renderChildren(node.children, ctx)}\n`,

  entry: (node, ctx) => `${renderChildren(node.children, ctx)}\n`,

  productionlist: (node, ctx) => {
    const children = node.lookupChildren("production");

    let markdown = "";
    const col2 = "::=";

    for (let child of children) {
      const col1 = child.attrs.tokenname;
      const col3 = renderChildren(child.children, ctx);
      markdown += `| ${col1} | ${col2} | ${col3} |\n`;
    }

    return markdown + "\n";
  },

  TabsNode: (node, ctx) => {
    const tabNodes = node.lookupChildren("TabNode");

    let tabs = "";

    for (let tabNode of tabNodes) {
      const container = tabNode.lookupChild("container");

      const codeBlock = container?.lookupChild("literal_block");
      const tabNameNode = container?.lookupChild("caption");

      let tabName = tabNameNode?.getText();
      let tabLang = codeBlock!.attrs["language"]!;

      if (tabName === tabLang) {
        tabName = tabName.split("-")[0];
        tabName =
          codeTabNames[tabName] ?? tabName[0].toUpperCase() + tabName.slice(1);
      }
      // todo add tabnames prefix/suffix
      tabs += `###### ${tabName}\n\n${renderNode(codeBlock!, ctx)}\n\n`;
    }

    return tabs;
  },

  versionmodified: (node, ctx) => {
    if (node.children.length) return renderChildren(node.children, ctx);
    return nullRenderer();
  },
};

// todo: create table in md without header
// todo: excape | in md
// todo: things that are links to another things on the page
