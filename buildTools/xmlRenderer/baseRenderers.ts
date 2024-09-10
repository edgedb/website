import fs from "fs-extra";
import { join as pathJoin } from "path";
import { PromiseType } from "@edgedb-site/shared/utils/typing";
import { copyImage } from "@edgedb-site/build-tools/utils";
import { XMLNode } from "@edgedb-site/build-tools/xmlutils";
import {
  LazyImage,
  HeaderLink,
  NextLink,
  Code,
  CodeTabs,
} from "@edgedb-site/shared/xmlRenderer/baseRenderNodes";
import { packRenderNodes, renderNode, XMLRenderer, XMLRendererMap } from ".";
import { RenderNode } from "./interfaces";
import {
  createElement,
  createNullRenderers,
  createSimpleRenderers,
  remapLink,
  renderChildren,
} from "./utils";
import { fullWidthImgSizes } from "./consts";
import {
  nodes as $,
  ReactComponent,
  RenderNodeConstructor,
} from "./renderNodes";
import { toAbsoluteURI } from "../utils";

const codeTabNames: { [key: string]: string } = {
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
    let imgData: PromiseType<ReturnType<typeof copyImage>> | null = null;

    const fullWidth =
      (autoFullWidth && !node.attrs.width) || node.attrs.width === "100%";
    if (await fs.pathExists(pathJoin(ctx.rootDir, node.attrs.uri!))) {
      imgData = await copyImage(
        ctx.rootDir,
        node.attrs.uri!,
        name,
        fullWidth ? `[${widths.join()}]` : "",
        ctx.logger
      );

      if (!imgData) {
        throw new Error(
          `Image data for image node not found (uri: ${node.attrs.uri})`
        );
      }
    }

    if (imgData && fullWidth) {
      const styles = ["picture", "fullWidth"];
      if (node.attrs.align === "right") {
        styles.push("floatRight");
      }

      // TODO: fix this
      if (node.attrs.caption) console.warn("LazyImage has caption");

      return [
        LazyImage({
          styles,
          url: imgData.path,
          alt: node.attrs["alt"],
          width: imgData.width!,
          height: imgData.height!,
          thumbnail: imgData.thumbnail,
          // caption: node.attrs.caption,
          widths: widths,
          sizes: fullWidthImgSizes,
        }),
      ];
    }

    const host = node.attrs.uri!.replace("://", "").split("/")[0];
    const isURL = host.includes(".") || host.includes("localhost");
    const src = imgData?.path
      ? `${imgData.path}${imgData.pathIncludesExt ? "" : ".webp"}`
      : // sphinx removes the leading '/' from urls, so if url does not have
      // domain add leading '/'
      isURL
      ? node.attrs.uri
      : `/${node.attrs.uri}`;

    if (fullWidth) {
      return [
        $.img({
          src: src,
          alt: node.attrs["alt"],
          styles: ["fullWidth"],
        }),
      ];
    }

    return [
      $.div(
        {
          styles: ["sizedImage"],
        },
        $.img({
          src: src,
          ...(imgData
            ? {
                width: imgData.width,
                height: imgData.height,
              }
            : {}),
          alt: node.attrs["alt"],
          style: {
            width: node.attrs.width,
          },
        })
      ),
    ];
  };

  return renderer;
}

export const note: XMLRenderer = async (node, ctx) => {
  const classNames: string[] = [];
  let tag: RenderNodeConstructor;
  if (node.attrs.classes && /\baside-nobg\b/.test(node.attrs.classes)) {
    tag = $.aside;
    classNames.push("nobg", node.name);
  } else if (node.attrs.classes && /\baside\b/.test(node.attrs.classes)) {
    tag = $.aside;
  } else {
    tag = ctx.paragraphLevel > 0 ? $.span : $.div;
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

  let href: string = "";
  let internalLink = false;
  if (node.attrs.refid) {
    internalLink = true;
    href = `#${node.attrs.refid}`;
  } else if (node.attrs.refuri) {
    let url: URL;
    try {
      url = new URL(node.attrs.refuri);
    } catch {
      url = new URL(toAbsoluteURI(node.attrs.refuri, ctx), ctx.baseUrl[0]);
    }

    const match = url.hostname.match(ctx.baseUrl[1]);
    if (match) {
      internalLink = true;
      href = remapLink(url.pathname, ctx.linkRemapping) + url.hash;
    }
  }

  if (internalLink || node.name === "footnote_reference") {
    attrs.href = href;

    const el = await createElement(
      node,
      node.attrs.refid ? $.a : (NextLink as any),
      ctx,
      attrs
    );

    if (node.name === "footnote_reference") {
      return [$.span({}, "[", ...el, "]")];
    }
    return el;
  } else {
    attrs.href = node.attrs.refuri;
    if (
      ctx.showExternalLinkIcons &&
      !new URL(attrs.href).hostname.match(/^(?:www\.)?edgedb\.com$/) &&
      !node.lookupChild("image")
    ) {
      attrs.className = "external-link";
    }
    return createElement(node, $.a, ctx, attrs);
  }
};

const literal: XMLRenderer = async (node, ctx) => {
  if (node.attrs["eql-lang"]) {
    return [
      Code({
        language: node.attrs["eql-lang"],
        code: node.getText(true),
        inline: true,
      }),
    ];
  } else {
    return createElement(node, $.code, ctx);
  }
};

export const literal_block: XMLRenderer = async (node, ctx) => {
  const language = node.attrs.language!;
  let code: string = node.getText(true);

  const collapsible = !!node.attrs.classes?.match(/\bcollapsible\b/);

  let captionNode: XMLNode | undefined = undefined;
  if (
    !ctx.ignoreCodeblockCaption &&
    node.parent?.name === "container" &&
    node.parent.attrs["literal_block"] === "True"
  ) {
    captionNode = node.parent.lookupChild("caption");
  }

  return [
    Code({
      language,
      code,
      caption:
        captionNode &&
        packRenderNodes(await renderChildren(captionNode.children, ctx)),
      styles: ["rest_border_box", "codeBlock"],
      collapsible,
    }),
  ];
};

export const titleRenderer: XMLRenderer = async (node, ctx) => {
  const id = node.parent?.attrs.ids?.split(" ")[0] ?? "";

  let title: string | RenderNode;
  if (node.attrs["edb-alt-title"]) {
    title = node.attrs["edb-alt-title"];
  } else if (node.children && node.children.length > 1) {
    title = $.span(
      {},
      ...((await renderChildren(node.children, {
        ...ctx,
        showExternalLinkIcons: false,
      })) ?? [])
    );
  } else {
    title = node.getAllText();
  }

  ctx.headers.push({
    id,
    title: node.getAllText(),
    level: ctx.sectionLevel,
  });

  return [
    HeaderLink(
      {
        id,
        level: Math.min(ctx.sectionLevel, 5),
        githubLink: ctx.sourceUrl,
      },
      title
    ),
  ];
};

export const sectionRenderer: XMLRenderer = async (node, ctx) => {
  ctx.sectionLevel += 1;

  let El: RenderNodeConstructor = $.section;
  if (ctx.sectionLevel >= 2) {
    // This is needed to make Safari Reader Mode work.
    El = $.div;
  }

  const collapsedNode = node.children_no_text[1];
  const isCollapsedBlock = !!(
    collapsedNode?.name == "container" &&
    collapsedNode.attrs["collapsed_block"] &&
    !collapsedNode.children_no_text.length
  );

  let titleNode: XMLNode | null = null;
  if (isCollapsedBlock) {
    titleNode = node.lookupChild("title") ?? null;
    if (titleNode) {
      node.removeChild(titleNode);
    }
  }

  const section = await createElement(node, El, ctx, {
    styles: ["section"],
    "data-section-id": node.attrs.ids?.split(/\s+/)[0],
  });

  if (isCollapsedBlock) {
    return [
      $.details(
        {},
        ...(titleNode
          ? [
              $.summary(
                {},
                $.div({}, ...((await renderNode(titleNode, ctx)) ?? []))
              ),
            ]
          : []),
        ...section
      ),
    ];
  } else {
    return section;
  }
};

export const tableRenderer: XMLRenderer = async (tableNode, ctx) => {
  const visitRows = async (
    root: XMLNode,
    cellEl: RenderNodeConstructor,
    widths: number[] | null = null
  ) => {
    let $col: RenderNode[] = [];
    let rowIndex = 0;

    for (let row of root.lookupChildren("row")) {
      let $row: RenderNode[] = [];
      let i = 0;

      for (let entry of row.lookupChildren("entry")) {
        let props: { [key: string]: any } = {
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
        $row.push(...(await createElement(entry, cellEl, ctx, props)));
        i++;
      }

      $col.push(
        $.tr(
          {
            key: rowIndex++,
          },
          ...$row
        )
      );
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
    $head = await visitRows(thead, $.th, widths);
  }
  if (titleNode && !$head.length) {
    $head = [
      $.tr(
        { key: "tableTitle" },
        $.th({ colSpan: 100 }, titleNode.getText(true))
      ),
    ];
  }

  let $body: RenderNode[] = [];
  if (tbody) {
    $body = await visitRows(tbody, $.td);
  }

  const $table: RenderNode[] = [];
  if ($head.length) {
    $table.push($.thead({ key: "tableHead" }, ...$head));
  }
  if ($body.length) {
    $table.push($.tbody({ key: "tableBody" }, ...$body));
  }

  const props: { [key: string]: any } = {};
  if (tableNode.attrs.classes) {
    let cls: string[] = [];
    for (let clsName of tableNode.attrs.classes.split(/\s+/g)) {
      clsName = clsName.replace(/-/g, "_");
      cls.push(clsName);
    }
    props.styles = cls;
  }

  return [$.div({ styles: ["tableWrapper"] }, $.table(props, ...$table))];
};

export const containerRenderer: XMLRenderer = async (node, ctx) => {
  if (node.attrs["eql-migration"]) {
    // let [pre, schema, suf] = node.children_no_text;
    // return [
    //   {
    //     type: RenderComponent.Migration,
    //     props: {
    //       pre: pre.getText(true),
    //       schema: schema.getText(true),
    //       suf: suf.getText(true),
    //       className: "prismjs-light-syntax",
    //     },
    //   },
    // ];
  }

  if (node.attrs["react-element"]) {
    return [ReactComponent(node.attrs["react-element"])];
  }

  if (node.attrs["section-intro-page"]) {
    ctx.pageAttrs.set("sectionIntro", node.attrs["section-intro-page"]);
    return null;
  }

  if (node.attrs["youtube-video-id"]) {
    const childNodes = node.children.filter(
      (n) => !(typeof n === "string") || n.trim()
    );
    return [
      $.div(
        {
          styles: ["youtube-embed"],
        },
        $.span({
          style: {
            backgroundImage: `url(https://i.ytimg.com/vi/${node.attrs["youtube-video-id"]}/mqdefault.jpg)`,
          },
        }),
        $.iframe({
          src: `https://www.youtube.com/embed/${node.attrs["youtube-video-id"]}`,
          frameBorder: "0",
          allowFullScreen: true,
          loading: "lazy",
        })
      ),
      ...(childNodes.length
        ? [
            $.div(
              {
                styles: ["youtube-embed-caption"],
              },
              ...((await renderChildren(childNodes, ctx)) ?? [])
            ),
          ]
        : []),
    ];
  }

  if (node.attrs["collapsed_block"]) {
    if (!node.children_no_text.length) {
      return null;
    }
    const summary = node.attrs["summary"];
    if (!summary) {
      throw new Error(
        `'edb:collapsed' block has content but is missing a ':summary:'`
      );
    }
    return [
      $.details(
        { styles: ["inline"] },
        $.summary({}, $.div({}, summary)),
        ...((await renderChildren(node.children, ctx)) ?? [])
      ),
    ];
  }

  if (node.attrs["literal_block"] === "True") {
    // skip handling here and let literal_block handle it instead
    const literalBlockNode = node.lookupChild("literal_block");
    return literalBlockNode ? renderNode(literalBlockNode, ctx) : null;
  }

  ctx.logger.error(
    `No renderer for container with attrs: ${JSON.stringify(node.attrs)}`
  );
  return null;
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

    let el = $.p;
    let props;
    if (ctx.paragraphLevel > 1) {
      el = $.span;
      props = { styles: ["nestedParagraph"] };
    }
    return createElement(node, el, ctx, props);
  },
  ...createSimpleRenderers({
    strong: $.b,
    emphasis: $.em,
    enumerated_list: $.ol,
    list_item: $.li,
    inline: $.span,
    rubric: $.h4,
  }),
  bullet_list: (node, ctx) => {
    return createElement(node, $.ul, ctx, {
      styles: node.attrs.classes?.split(" ").includes("ticklist")
        ? ["tickList"]
        : [],
    });
  },
  literal_block,
  block_quote: async (node, ctx) => {
    const children = [
      ...(await createElement(node, $.div, ctx, { styles: ["quote"] })),
    ];
    if (node.attrs.attribution) {
      children.push(
        $.div(
          {
            styles: ["attribution"],
          },
          $.p({}, node.attrs.attribution!)
        )
      );
    }

    return [
      $.div(
        {
          styles: ["blockquote"],
        },
        ...children
      ),
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
        $.div({
          dangerouslySetInnerHTML: { __html: node.getText() },
        }),
      ];
    } else {
      return [
        Code({
          language: node.attrs.format!,
          code: node.getText(true),
          className: "prismjs-light-syntax",
          styles: ["rawfile"],
        }),
      ];
    }
  },
  footnote: async (node, ctx) => {
    const label = node.lookupChild("label");
    const para = node.lookupChild("paragraph");

    let backlink: RenderNode;
    if (node.attrs.backrefs) {
      const backref = node.attrs.backrefs.split(/\s+/g)[0];
      backlink = $.a(
        {
          href: "#" + backref,
          styles: ["label"],
        },
        `[${label?.getText(true) ?? ""}]`
      );
    } else {
      backlink = $.span({}, `[${label?.getText(true) ?? ""}]`);
    }

    return [
      $.p(
        {
          id: node.attrs.ids,
          styles: ["footnote"],
        },
        backlink,
        " ",
        ...(await renderChildren(para?.children, ctx))!
      ),
    ];
  },
  //
  literal,
  literal_strong: async (node, ctx) => {
    return [$.strong({}, ...((await literal(node, ctx)) ?? []))];
  },
  literal_emphasis: async (node, ctx) => {
    return [$.em({}, ...((await literal(node, ctx)) ?? []))];
  },
  container: containerRenderer,
  title: titleRenderer,
  definition_list: async (node, ctx) => {
    let items = node.lookupChildren("definition_list_item");

    let dl: RenderNode[] = [];
    for (let [i, item] of items.entries()) {
      let term = item.lookupChild("term")!;
      let def = item.lookupChild("definition")!;

      dl.push(...(await createElement(term, $.dt, ctx, { key: `dt${i}` })));
      dl.push(...(await createElement(def, $.dd, ctx, { key: `dd${i}` })));
    }

    return [$.dl({ styles: ["definition_list"] }, ...dl)];
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
      nodes.map(async ({ tokenName, ids, children }) =>
        $.tr(
          {
            key: tokenName,
          },

          $.td({ id: ids }, tokenName),
          $.td({ styles: ["prod_list_define"] }, "::="),
          $.td({}, ...((await renderChildren(children, ctx)) ?? []))
        )
      )
    );

    return [
      $.div(
        {
          styles: ["prod_list"],
        },
        $.table({}, $.tbody({}, ...prods))
      ),
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
          codeBlock: packRenderNodes(
            await ctx.renderers.literal_block!(codeBlock, {
              ...ctx,
              ignoreCodeblockCaption: true,
            })
          ),
        };
      })
    );

    return [
      CodeTabs({
        styles: ["raisedCodeBlock"],
        // group: node.attrs.tabgroup,
        tabs: codeTabs,
      }),
    ];
  },
};
