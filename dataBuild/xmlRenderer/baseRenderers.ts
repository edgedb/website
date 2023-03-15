import fs from "fs-extra";
import {join as pathJoin} from "path";
import {PromiseType} from "@/utils/typing";
import {copyImage} from "@edgedb/site-build-tools/utils";
import {XMLNode} from "@edgedb/site-build-tools/xmlutils";

import {packRenderNodes, renderNode, XMLRenderer, XMLRendererMap} from ".";
import {RenderComponent, RenderNode} from "./interfaces";
import {
  createElement,
  createNullRenderers,
  createSimpleRenderers,
  renderChildren,
  toAbsoluteURI,
} from "./utils";
import {fullWidthImgSizes} from "../consts";

const codeTabNames: {[key: string]: string} = {
  edgeql: "EdgeQL",
  js: "JS",
  typescript: "TypeScript",
  csharp: "C#",
  cs: "C#",
  fsharp: "F#",
};

export function makeImageRenderer(
  name: string,
  widths: number[],
  autoFullWidth: boolean = true
) {
  const renderer: XMLRenderer = async (node, ctx) => {
    let img: PromiseType<ReturnType<typeof copyImage>> | null = null;

    const fullWidth = autoFullWidth || node.attrs.width === "100%";
    if (await fs.pathExists(pathJoin(ctx.rootDir, node.attrs.uri!))) {
      img = await copyImage(
        ctx.rootDir,
        node.attrs.uri!,
        name,
        fullWidth ? `[${widths.join()}]` : "",
        ctx.logger
      );

      if (!img) {
        throw new Error(
          `Image data for image node not found (uri: ${node.attrs.uri})`
        );
      }
    }

    if (img && fullWidth) {
      return [
        {
          type: RenderComponent.LazyImage,
          props: {
            styles: ["picture", "fullWidth"],
            url: img.path,
            width: img.width!,
            height: img.height!,
            thumbnail: img.thumbnail,
            caption: node.attrs.caption,
            widths: widths,
            sizes: fullWidthImgSizes,
          },
        },
      ];
    }

    const host = node.attrs.uri!.replace("://", "").split("/")[0];
    const isURL = host.includes(".") || host.includes("localhost");
    const src = img?.path
      ? `${img.path}${img.pathIncludesExt ? "" : ".webp"}`
      : // sphinx removes the leading '/' from urls, so if url does not have
      // domain add leading '/'
      isURL
      ? node.attrs.uri
      : `/${node.attrs.uri}`;

    if (fullWidth) {
      return [
        {
          type: "img",
          props: {
            src: src,
            styles: ["fullWidth"],
          },
        },
      ];
    }

    return [
      {
        type: "img",
        props: {
          src: src,
          ...(img
            ? {
                width: img.width,
                height: img.height,
              }
            : {}),
          style: {width: node.attrs.width},
        },
      },
    ];
  };

  return renderer;
}

export const note: XMLRenderer = async (node, ctx) => {
  const classNames: string[] = [];
  let tag: string;
  if (node.attrs.classes && /\baside-nobg\b/.test(node.attrs.classes)) {
    tag = "aside";
    classNames.push("nobg", node.name);
  } else if (node.attrs.classes && /\baside\b/.test(node.attrs.classes)) {
    tag = "aside";
  } else {
    tag = "div";
    classNames.push("border_box", node.name);

    // If first child is not paragraph, instead empty paragraph for note type
    // name to be prepended to in css
    const firstChild = node.children.find(
      (n) => typeof n !== "string" || n.trim() !== ""
    );
    if (
      !firstChild ||
      typeof firstChild === "string" ||
      firstChild.name !== "paragraph"
    ) {
      node["_children"].unshift(new XMLNode("paragraph", {}, [""]));
    }
  }
  return createElement(node, tag, ctx, {
    styles: classNames,
  });
};

export const reference: XMLRenderer = async (node, ctx) => {
  const attrs: any = {};

  if (node.attrs["eql-type"]) {
    attrs.className = `eql-ref-${node.attrs["eql-type"]}`;
  }

  if (
    node.attrs.internal?.toLowerCase() === "true" ||
    node.name === "footnote_reference"
  ) {
    attrs.href = node.attrs.refid
      ? `#${node.attrs.refid}`
      : toAbsoluteURI(node.attrs.refuri!, ctx);

    const linkRef = node.attrs.refid
      ? `${ctx.relname}#${node.attrs.refid}`
      : attrs.href;
    const linkVersion =
      ctx.linkVersionMapping?.get(linkRef) ??
      ctx.linkVersionMapping?.get(linkRef.split("#")[0]);

    // if (linkVersion) {
    //   console.log(attrs.href, ctx.relname);
    // }

    const el = await createElement(
      node,
      node.attrs.refid ? "a" : RenderComponent.NextLink,
      ctx,
      attrs
    );

    if (node.name === "footnote_reference") {
      return [
        {
          type: "span",
          children: ["[", ...el, "]"],
        },
      ];
    }
    if (linkVersion) {
      return [
        {
          type: RenderComponent.VersionedLink,
          props: {
            versionAdded: linkVersion,
          },
          children: el,
        },
      ];
    }
    return el;
  } else {
    attrs.href = node.attrs.refuri;
    return createElement(node, "a", ctx, attrs);
  }
};

const literal: XMLRenderer = async (node, ctx) => {
  if (node.attrs["eql-lang"]) {
    return [
      {
        type: RenderComponent.Code,
        props: {
          language: node.attrs["eql-lang"],
          code: node.getText(true),
          inline: true,
        },
      },
    ];
  } else {
    return createElement(node, "code", ctx);
  }
};

export const literal_block: XMLRenderer = async (node, ctx) => {
  if (ctx.seenLiteralBlockNodes.has(node)) {
    return null;
  }

  const language = node.attrs.language!;
  let code: string | {default: string; [ver: string]: string} = node.getText(
    true
  );

  const versionedBlocks: {[ver: string]: string} = {};
  if (node.attrs["version_lt"]) {
    versionedBlocks[node.attrs["version_lt"]] = code;
    const nodes = node.parent!.children.slice(node.childIndex! - 1).reverse();
    while (nodes.length) {
      const nextNode = nodes.pop();
      if (typeof nextNode === "string" && nextNode.trim() === "") {
        continue;
      }
      if (
        !nextNode ||
        typeof nextNode === "string" ||
        nextNode.name !== "literal_block"
      ) {
        throw new Error(
          `${ctx.relname}: last block in group of versioned code blocks must not have :version-lt: specified`
        );
      } else {
        if (nextNode.attrs.language !== language) {
          throw new Error(
            `${ctx.relname}: all blocks in group of versioned code blocks must have the same language`
          );
        }
        ctx.seenLiteralBlockNodes.add(nextNode);
        const version = nextNode.attrs["version_lt"];
        const _code = nextNode.getText(true);
        if (version) {
          versionedBlocks[version] = _code;
        } else {
          versionedBlocks["default"] = _code;
          node = nextNode;
          break;
        }
      }
    }
    code = versionedBlocks as any;
  }

  const collapsible = !!node.attrs.classes?.match(/\bcollapsible\b/);

  return [
    {
      type: RenderComponent.Code,
      props: {
        language,
        code,
        styles: ["rest_border_box", "codeBlock"],
        collapsible,
      },
    },
  ];
};

export const titleRenderer: XMLRenderer = async (node, ctx) => {
  const id = node.parent?.attrs.ids?.split(" ")[0] ?? "";

  let title: string | RenderNode;
  if (node.attrs["edb-alt-title"]) {
    title = node.attrs["edb-alt-title"];
  } else if (node.children && node.children.length > 1) {
    title = {
      type: "span",
      children: await renderChildren(node.children, ctx),
    };
  } else {
    title = node.getAllText();
  }

  const versionAdded = ctx.linkVersionMapping?.get(
    `${ctx.relname}${ctx.sectionLevel !== 1 ? `#${id}` : ""}`
  );

  ctx.headers.push({
    id,
    title: node.getAllText(),
    level: ctx.sectionLevel,
    versionAdded,
  });

  return [
    {
      type: RenderComponent.HeaderLink,
      props: {
        id,
        level: Math.min(ctx.sectionLevel, 5),
        githubLink: ctx.sourceUrl,
        versionAdded,
      },
      children: [title],
    },
  ];
};

export const sectionRenderer: XMLRenderer = async (node, ctx) => {
  ctx.sectionLevel += 1;

  let El: any = "section";
  if (ctx.sectionLevel >= 2) {
    // This is needed to make Safari Reader Mode work.
    El = "div";
  }

  return createElement(node, El, ctx, {
    styles: ["section"],
    "data-section-id": node.attrs.ids?.split(/\s+/)[0],
  });
};

export const tableRenderer: XMLRenderer = async (tableNode, ctx) => {
  const visitRows = async (
    root: XMLNode,
    cellElName: string,
    widths: number[] | null = null
  ) => {
    let $col: RenderNode[] = [];
    let rowIndex = 0;

    for (let row of root.lookupChildren("row")) {
      let $row: RenderNode[] = [];
      let i = 0;

      for (let entry of row.lookupChildren("entry")) {
        let props: {[key: string]: any} = {
          key: i,
        };
        if (entry.attrs.morecols) {
          props["colSpan"] = parseInt(entry.attrs.morecols) + 1;
        }
        if (entry.attrs.morerows) {
          props["rowSpan"] = parseInt(entry.attrs.morerows) + 1;
        }
        if (widths && widths[i]) {
          props.width = widths[i] + "%";
        }
        $row.push(...(await createElement(entry, cellElName, ctx, props)));
        i++;
      }

      $col.push({
        type: "tr",
        props: {
          key: rowIndex++,
        },
        children: $row,
      });
    }

    return $col;
  };

  const colspec = tableNode.lookupAllChildren("colspec");
  const widths: number[] = [];
  if (colspec) {
    for (let n of colspec) {
      if (n.attrs.colwidth) {
        widths.push(parseFloat(n.attrs.colwidth));
      }
    }
  }

  const titleNode = tableNode.lookupChild("title");
  const node = tableNode.lookupChild("tgroup")!;
  const nCols = node.lookupChildren("colspec").length;
  const thead = node.lookupChild("thead");
  const tbody = node.lookupChild("tbody");

  let $head: RenderNode[] = [];
  if (thead) {
    $head = await visitRows(thead, "th", widths);
  }
  if (titleNode && !$head.length) {
    $head = [
      {
        type: "tr",
        props: {key: "tableTitle"},
        children: [
          {
            type: "th",
            props: {colSpan: 100},
            children: [titleNode.getText(true)],
          },
        ],
      },
    ];
  }

  let $body: RenderNode[] = [];
  if (tbody) {
    $body = await visitRows(tbody, "td");
  }

  const $table: RenderNode[] = [];
  if ($head.length) {
    $table.push({type: "thead", props: {key: "tableHead"}, children: $head});
  }
  if ($body.length) {
    $table.push({type: "tbody", props: {key: "tableBody"}, children: $body});
  }

  const props: {[key: string]: any} = {};
  if (tableNode.attrs.classes) {
    let cls: string[] = [];
    for (let clsName of tableNode.attrs.classes.split(/\s+/g)) {
      clsName = clsName.replace(/-/g, "_");
      cls.push(clsName);
    }
    props.styles = cls;
  }

  return [
    {
      type: "div",
      props: {styles: ["tableWrapper"]},
      children: [{type: "table", props, children: $table}],
    },
  ];
};

export const baseRenderers: XMLRendererMap = {
  document: (node, ctx) => {
    return renderChildren(node.children, ctx);
  },
  section: sectionRenderer,
  ...createNullRenderers([
    "transition",
    "comment",
    "target",
    "index",
    "todo_node",
  ]),
  paragraph: (node, ctx) => {
    ctx.paragraphLevel += 1;

    let el = "p";
    let props;
    if (ctx.paragraphLevel > 1) {
      el = "span";
      props = {styles: ["nestedParagraph"]};
    }
    return createElement(node, el, ctx, props);
  },
  ...createSimpleRenderers({
    strong: "b",
    emphasis: "em",
    enumerated_list: "ol",
    list_item: "li",
    inline: "span",
    rubric: "h4",
  }),
  bullet_list: (node, ctx) => {
    return createElement(node, "ul", ctx, {
      styles: node.attrs.classes?.split(" ").includes("ticklist")
        ? ["tickList"]
        : [],
    });
  },
  literal_block,
  block_quote: async (node, ctx) => {
    const children = [
      ...(await createElement(node, "div", ctx, {styles: ["quote"]})),
    ];
    if (node.attrs.attribution) {
      children.push({
        type: "div",
        props: {
          styles: ["attribution"],
        },
        children: [{type: "p", children: [node.attrs.attribution!]}],
      });
    }

    return [
      {
        type: "div",
        props: {
          styles: ["blockquote"],
        },
        children,
      },
    ];
  },
  note,
  warning: note,
  important: note,
  reference,
  footnote_reference: reference,
  raw: async (node, ctx) => {
    if (node.attrs.format === "html") {
      return [
        {
          type: "div",
          props: {
            dangerouslySetInnerHTML: {__html: node.getText()},
          },
        },
      ];
    } else {
      return [
        {
          type: RenderComponent.Code,
          props: {
            language: node.attrs.format!,
            code: node.getText(true),
            className: "prismjs-light-syntax",
            styles: ["rawfile"],
          },
        },
      ];
    }
  },
  footnote: async (node, ctx) => {
    const label = node.lookupChild("label");
    const para = node.lookupChild("paragraph");

    let backlink: RenderNode;
    if (node.attrs.backrefs) {
      const backref = node.attrs.backrefs.split(/\s+/g)[0];
      backlink = {
        type: "a",
        props: {
          href: "#" + backref,
          styles: ["label"],
        },
        children: [`[${label?.getText(true) ?? ""}]`],
      };
    } else {
      backlink = {
        type: "span",
        children: [`[${label?.getText(true) ?? ""}]`],
      };
    }

    return [
      {
        type: "p",
        props: {
          id: node.attrs.ids,
          styles: ["footnote"],
        },
        children: [
          backlink,
          " ",
          ...(await renderChildren(para?.children, ctx))!,
        ],
      },
    ];
  },
  //
  literal,
  literal_strong: async (node, ctx) => {
    return [{type: "strong", children: await literal(node, ctx)}];
  },
  literal_emphasis: async (node, ctx) => {
    return [{type: "em", children: await literal(node, ctx)}];
  },
  container: async (node, ctx) => {
    if (node.attrs["eql-migration"]) {
      let [pre, schema, suf] = node.children_no_text;
      return [
        {
          type: RenderComponent.Migration,
          props: {
            pre: pre.getText(true),
            schema: schema.getText(true),
            suf: suf.getText(true),
            className: "prismjs-light-syntax",
          },
        },
      ];
    }

    if (node.attrs["react-element"]) {
      return [
        {
          type: RenderComponent.ReactComponent,
          props: {
            component: node.attrs["react-element"],
          },
        },
      ];
    }

    if (node.attrs["section-intro-page"]) {
      ctx.pageAttrs.set("sectionIntro", node.attrs["section-intro-page"]);
      return null;
    }

    if (node.attrs["classes"] === "literal-block-wrapper") {
      let literalBlock = node.lookupChild("literal_block");
      let caption = node.lookupChild("caption");

      if (literalBlock) {
        // Future: 'literal-block-wrapper' might not always wrap a codeblock, should this be handled?
        return [
          {
            type: RenderComponent.Code,
            props: {
              caption:
                caption &&
                packRenderNodes(await renderChildren(caption.children, ctx)),
              language: literalBlock.attrs.language!,
              code: literalBlock.getText(true),
              styles: ["rawfile"],
            },
          },
        ];
      }
    }

    ctx.logger.error(
      `No renderer for container with attrs: ${JSON.stringify(node.attrs)}`
    );
    return null;
  },
  title: titleRenderer,
  definition_list: async (node, ctx) => {
    let items = node.lookupChildren("definition_list_item");

    let dl: RenderNode[] = [];
    for (let [i, item] of items.entries()) {
      let term = item.lookupChild("term")!;
      let def = item.lookupChild("definition")!;

      dl.push(...(await createElement(term, "dt", ctx, {key: `dt${i}`})));
      dl.push(...(await createElement(def, "dd", ctx, {key: `dd${i}`})));
    }

    return [
      {
        type: "dl",
        props: {styles: ["definition_list"]},
        children: dl,
      },
    ];
  },
  productionlist: async (node, ctx) => {
    interface ProductionListNode {
      tokenName: string;
      ids?: string;
      children: (string | XMLNode)[];
    }

    const nodes: ProductionListNode[] = [];
    let last: ProductionListNode | null = null;

    for (let prod of node.children_no_text) {
      if (prod.name != "production") {
        ctx.logger.error(
          "unexpected <productionlist> child node: " + prod.name
        );
        continue;
      }

      if (prod.attrs.tokenname) {
        last = {
          tokenName: prod.attrs.tokenname,
          ids: prod.attrs.ids,
          children: [...prod.children],
        };

        nodes.push(last);
      } else {
        if (!last) {
          ctx.logger.error("invalid <production> tag without @tokenname");
          continue;
        }
        last.children.push("\n");
        last.children.push(...prod.children);
      }
    }

    const prods: RenderNode[] = await Promise.all(
      nodes.map(async ({tokenName, ids, children}) => ({
        type: "tr",
        props: {
          key: tokenName,
        },
        children: [
          {type: "td", props: {id: ids}, children: [tokenName]},
          {
            type: "td",
            props: {styles: ["prod_list_define"]},
            children: ["::="],
          },
          {type: "td", children: await renderChildren(children, ctx)},
        ],
      }))
    );

    return [
      {
        type: "div",
        props: {
          styles: ["prod_list"],
        },
        children: [
          {
            type: "table",
            children: [
              {
                type: "tbody",
                children: prods,
              },
            ],
          },
        ],
      },
    ];
  },
  table: tableRenderer,
  TabsNode: async (node, ctx) => {
    const codeTabs = await Promise.all(
      node.lookupChildren("TabNode").map(async (codeTab) => {
        const isCodeTab = codeTab.attrs["classes"]?.includes("codetab");
        const container = codeTab.lookupChild("container");

        if (!container) {
          throw new Error("'TabNode' doesn't contain 'container' node");
        }

        // const isCodeTab = container?.attrs["classes"]?.includes(
        //   "literal-block-wrapper"
        // );

        if (!isCodeTab) {
          const tabName = codeTab.attrs["tabname"];
          const tabLang = tabName;
          codeTab.walk((ch) => {});
          return {
            name: tabName!,
            lang: tabLang!,
            kind: "text" as const,
            codeBlock: packRenderNodes(
              await renderChildren(container.children, ctx)
            )!,
          };
        }

        const codeBlock = container.lookupChild("literal_block");
        const tabNameNode = container.lookupChild("caption");

        if (!tabNameNode) {
          throw new Error("'TabNode' doesn't contain 'caption' node");
        }
        if (!codeBlock) {
          throw new Error("'TabNode' doesn't contain 'literal_block' node");
        }

        let tabName = tabNameNode.getText();
        let tabLang = codeBlock!.attrs["language"]!;

        if (tabName === tabLang) {
          tabName = tabName.split("-")[0];
          tabName =
            codeTabNames[tabName] ??
            tabName[0].toUpperCase() + tabName.slice(1);
        }

        return {
          name: tabName,
          lang: tabLang,
          kind: "code" as const,
          codeBlock: packRenderNodes(await literal_block(codeBlock, ctx)),
        };
      })
    );

    return [
      {
        type: RenderComponent.CodeTabs,
        props: {
          styles: ["raisedCodeBlock"],
          group: node.attrs.tabgroup,
          tabs: codeTabs,
        },
      },
    ];
  },
};
