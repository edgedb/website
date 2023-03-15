import {XMLNode} from "@edgedb/site-build-tools/xmlutils";
import {TocExtractor} from "@edgedb/site-build-tools/sphinx/toc";
import {buildSig} from "@edgedb/site-build-tools/sphinx/buildSig";

import {packRenderNodes, RenderXMLContext, XMLRendererMap} from ".";
import {
  createElement,
  createIdAnchors,
  nullRenderer,
  renderChildren,
} from "./utils";
import {
  sectionRenderer,
  titleRenderer,
  literal_block,
  tableRenderer,
  reference,
  makeImageRenderer,
} from "./baseRenderers";

import {RenderComponent, RenderNode} from "./interfaces";

function renderToc(node: XMLNode, ctx: RenderXMLContext) {
  if (!node.lookupChildren("compact_paragraph").length) {
    /* hidden toc tree */
    return null;
  }

  function renderTreeNodes(
    nodes: any,
    parentUri: string | null = null,
    prevlevel = 0
  ): RenderNode[] {
    let items: RenderNode[] = [];

    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];

      let el: RenderNode | string = node.title;
      if (node.uri) {
        el = {
          type: RenderComponent.NextLink,
          props: {
            href: basePath + node.uri,
          },
          children: [el],
        };
        parentUri = node.uri;
      } else if (node.anchor && parentUri) {
        el = {
          type: RenderComponent.NextLink,
          props: {
            href: basePath + parentUri + node.anchor,
          },
          children: [el],
        };
      }

      items.push({
        type: "li",
        children: [
          {
            type: "div",
            props: {styles: ["toc_section_title"]},
            children: [el],
          },
          ...(node.children
            ? renderTreeNodes(node.children, parentUri, prevlevel + 1)
            : []),
        ],
      });
    }

    if (!items.length) {
      return [];
    }

    return [{type: "ul", children: items}];
  }

  let basePath = ctx.relname!;
  if (basePath.endsWith("/index")) {
    basePath = basePath.slice(0, -5);
  } else if (basePath.endsWith("/__toc__")) {
    basePath = basePath.slice(0, -7);
  }

  let tree = TocExtractor.extract(node);
  let root = renderTreeNodes(tree);

  if (!root) {
    return null;
  }

  return [
    {
      type: "div",
      props: {styles: ["toc"]},
      children: [
        ...(tree.caption ? [{type: "h4", children: [tree.caption]}] : []),
        ...root,
      ],
    },
  ];
}

export const docsRenderers: XMLRendererMap = {
  title: async (node, ctx) => {
    if (ctx.sectionLevel !== 1) {
      return titleRenderer(node, ctx);
    }
    return null;
  },
  image: makeImageRenderer("docs", [940, 770], false),
  figure: async (node, ctx) => {
    return createElement(node, "figure", ctx);
  },
  caption: async (node, ctx) => {
    return createElement(node, "figcaption", ctx);
  },
  section: async (node, ctx) => {
    if (ctx.sectionLevel === 0 && node.children) {
      ctx.sectionLevel += 1;

      const titleNode = node.lookupChild("title");

      const idAnchors = createIdAnchors(node.attrs.ids ?? "")[1];

      const sectionIntro = ctx.pageAttrs.get("sectionIntro");
      if (sectionIntro) {
        return [
          ...idAnchors,
          {
            type: "section",
            props: {styles: ["sectionIntro"]},
            children: [
              {
                type: "div",
                props: {styles: ["sectionIntroHeader"]},
                children: [
                  {
                    type: RenderComponent.DocIntroIllustration,
                    props: {name: sectionIntro},
                  },
                  ...(titleNode
                    ? (await titleRenderer(titleNode, ctx)) ?? []
                    : []),
                ],
              },
              ...((await renderChildren(node.children, ctx)) ?? []),
            ],
          },
        ];
      }

      return [
        ...idAnchors,
        ...(titleNode ? (await titleRenderer(titleNode, ctx)) ?? [] : []),
        {type: "section", children: await renderChildren(node.children, ctx)},
      ];
    } else {
      const sectionContent = await sectionRenderer(node, ctx);
      const versionNode = node.lookupChild("versionmodified");

      if (
        versionNode?.attrs.type === "versionadded" &&
        versionNode.children.length === 0
      ) {
        return [
          {
            type: RenderComponent.VersionedBlock,
            props: {
              versionAdded: versionNode.attrs.version!,
            },
            children: sectionContent,
          },
        ];
      } else {
        return sectionContent;
      }
    }
  },
  desc: async (node, ctx) => {
    const {objtype, domain} = node.attrs;
    const sigNodes = node.lookupChildren("desc_signature");
    const contentNode = node.lookupChild("desc_content");
    let anno: string | null = null;

    const descRefId = sigNodes[0]?.attrs.ids?.split(" ")[0];
    let titleSig = descRefId
      ? ctx.pageAttrs.get("descRefs")?.[descRefId] ?? null
      : null;

    const sigIds: string[] = [];
    let sigs: string[] = [];
    for (let sigNode of sigNodes) {
      let sig = sigNode.attrs["eql-signature"] || sigNode.attrs["eql-name"];
      let fullname: string | undefined | null = sig;
      if (!sig) {
        [sig, anno, fullname] = buildSig(objtype!, domain!, sigNode);
      }
      const sigId = sigNode.attrs["ids"];
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
        sigs.push(sig);
      }
      if (sigId) {
        sigIds.push(...sigId.split(" "));
      }
    }

    if (titleSig && sigs.length === 1 && sigs[0] === titleSig) {
      sigs = [];
    }

    if (!titleSig) {
      titleSig = sigs.shift();
    }

    if (!titleSig) {
      throw new Error("Cannot resolve title signature for desc block");
    }

    const versionAddedNode = contentNode?.lookupChild("versionmodified");
    const versionAdded =
      !versionAddedNode?.children.length &&
      versionAddedNode?.attrs.type === "versionadded"
        ? versionAddedNode.attrs.version!
        : null;
    if (
      versionAdded &&
      contentNode?.children
        .slice(0, versionAddedNode?.childIndex)
        .filter((node) =>
          typeof node === "string"
            ? node.trim() !== ""
            : node.name !== "field_list"
        ).length !== 0
    ) {
      throw new Error(
        `${ctx.relname}: ${titleSig}: versionadded directive must be first ` +
          `element in desc block unless it has content`
      );
    }

    const content = await renderChildren(contentNode?.children, {
      ...ctx,
      renderers: {
        ...ctx.renderers,
        desc: nullRenderer,
      },
    });

    const descBlock: (string | RenderNode)[] = [
      {
        type: RenderComponent.DescBlock,
        props: {
          objtype: objtype!,
          domain: domain!,
          sigs,
          sigIds,
          anno,
          titleSig,
          githubLink: ctx.sourceUrl,
        },
        children: content,
      },
      ...((await renderChildren(node.lookupAllChildren("desc"), ctx)) ?? []),
    ];

    if (versionAdded) {
      return [
        {
          type: RenderComponent.VersionedBlock,
          props: {
            versionAdded: versionAdded,
            overhang: true,
          },
          children: descBlock,
        },
      ];
    }
    return descBlock;
  },
  versionmodified: async (node, ctx) => {
    const note = [
      {
        type: "div",
        props: {
          styles: ["note"],
        },
        children: [
          {
            type: "p",
            children: [
              `${
                node.attrs.type === "versionchanged" ? "Changed" : "Added"
              } in v${node.attrs.version}`,
            ],
          },
          ...((await renderChildren(node.children, ctx)) ?? []),
        ],
      },
    ];

    if (node.attrs.type === "versionadded") {
      if (node.children.length) {
        return [
          {
            type: RenderComponent.VersionedBlock,
            props: {
              versionAdded: node.attrs.version!,
            },
            children: note,
          },
        ];
      } else if (
        node.parent?.name === "section" ||
        node.parent?.name === "document"
      ) {
        return null;
      }
    }

    return note;
  },
  literal_block: async (node, ctx) => {
    let childBlock = await literal_block(node, ctx);

    if (!childBlock) {
      return null;
    }

    if (node.attrs.language === "bash") {
      childBlock = [
        {
          type: "div",
          props: {
            styles: ["terminalCodeBlock"],
            "data-theme": "dark",
          },
          children: childBlock,
        },
      ];
    }

    if (node.parent?.name === "section") {
      return [
        {
          type: "div",
          props: {
            styles: ["raisedCodeBlock"],
          },
          children: childBlock,
        },
      ];
    } else {
      return childBlock;
    }
  },
  compound: async (node, ctx) => {
    if (node.attrs.classes?.includes("toctree")) {
      return renderToc(node, ctx);
    }

    ctx.logger.error(
      `Unknown compound node with attrs: ${JSON.stringify(node.attrs)}`
    );
    return null;
  },
  field: async (node, ctx) => {
    let fnNode = node.lookupChild("field_name");
    let fbNode = node.lookupChild("field_body");

    if (!fnNode || !fbNode) {
      ctx.logger.warn("<field> node without <field_name> and <field_body>");
      return null;
    }

    return [
      {
        type: "div",
        props: {styles: ["field"]},
        children: [
          {
            type: "div",
            props: {styles: ["fieldName"]},
            children: await renderChildren(fnNode.children, ctx),
          },
          {
            type: "div",
            props: {styles: ["fieldBody"]},
            children: await renderChildren(fbNode.children, ctx),
          },
        ],
      },
    ];
  },
  field_list: async (node, ctx) => {
    if (
      node.parent?.parent?.attrs.domain === "py" ||
      node.parent?.parent?.attrs.domain === "js" ||
      node.parent?.parent?.attrs.domain === "dn"
    ) {
      return [
        {
          type: "div",
          props: {styles: ["fields"]},
          children: await renderChildren(node.children, ctx),
        },
      ];
    } else {
      return null;
    }
  },
  glossary: async (node, ctx) => {
    return [
      {
        type: "div",
        props: {styles: ["glossary"]},
        children: await renderChildren(node.children, ctx),
      },
    ];
  },
  table: async (node, _ctx) => {
    const ctx = {..._ctx};

    if (node.attrs.classes?.includes("funcoptable")) {
      ctx.renderers = {
        ...ctx.renderers,
        literal: async (node, ctx) => {
          return [
            {
              type: RenderComponent.DescRef,
              props: {classes: node.attrs.classes, text: node.getText(true)},
            },
          ];
        },
        reference: async (node, ctx) => {
          const descRefId = node.attrs.refid;
          const literalNode = node.lookupChild("literal");

          if (descRefId && literalNode) {
            if (!ctx.pageAttrs.has("descRefs")) {
              ctx.pageAttrs.set("descRefs", {});
            }
            ctx.pageAttrs.get("descRefs")[descRefId] = {
              classes: literalNode.attrs.classes,
              text: literalNode.getText(true),
            };
          }

          return reference(node, ctx);
        },
      };
    }

    const table = await tableRenderer(node, ctx);

    if (node.attrs.classes?.includes("seealso")) {
      return [
        {
          type: "div",
          props: {styles: ["seealso"]},
          children: [
            {
              type: "div",
              props: {styles: ["seealsoSpacer"]},
              children: ["︙"],
            },
            {
              type: "div",
              props: {styles: ["shadowedTable"]},
              children: table,
            },
          ],
        },
      ];
    }

    if (node.parent?.name === "section") {
      let styles = ["shadowedTable"];
      if (node.attrs.classes?.includes("vertheadertable")) {
        styles.push("vertHeaderTable");
      }

      return [
        {
          type: "div",
          props: {
            styles: styles,
          },
          children: table,
        },
      ];
    } else {
      return table;
    }
  },
};

// export const docsReactRenderers: ReactElementRendererMap = {
//   DocsNavTable: () => <DocsNavTable />,
// };
