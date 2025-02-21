import { XMLNode } from "@edgedb-site/build-tools/xmlutils";
import { TocExtractor } from "@edgedb-site/build-tools/sphinx/toc";
import { buildSig } from "@edgedb-site/build-tools/sphinx/buildSig";

import {
  packRenderNodes,
  RenderXMLContext,
  XMLRenderer,
  XMLRendererMap,
} from "@edgedb-site/build-tools/xmlRenderer";
import {
  createElement,
  createIdAnchors,
  nullRenderer,
  renderChildren,
} from "@edgedb-site/build-tools/xmlRenderer/utils";
import {
  sectionRenderer,
  titleRenderer as _titleRenderer,
  tableRenderer,
  reference as _baseReference,
  makeImageRenderer,
} from "@edgedb-site/build-tools/xmlRenderer/baseRenderers";
import {
  PackedRenderNode,
  RenderComponentType,
  RenderNode,
} from "@edgedb-site/build-tools/xmlRenderer/interfaces";

import {
  nodes as $,
  ReactComponent,
  RenderNodeConstructor,
} from "@edgedb-site/build-tools/xmlRenderer/renderNodes";

import {
  NextLink,
  Code,
} from "@edgedb-site/shared/xmlRenderer/baseRenderNodes";

import {
  DocIntroIllustration,
  VersionedNote,
  VersionedBlock,
  VersionedLink,
  DescBlock,
  DescRef,
  VersionedCode,
  VersionedHeaderLink,
  VersionedContentReplace,
} from "@/components/xmlRenderer/docsRenderNodes";

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
      if (node.type === "external") {
        const props = { href: node.uri } as any;
        if (ctx.showExternalLinkIcons) {
          props.className = "external-link";
        }
        el = $.a(props, el);
      } else if (node.uri) {
        el = NextLink(
          {
            href: basePath + node.uri,
          },
          el
        );
        parentUri = node.uri;
      } else if (node.anchor && parentUri) {
        el = NextLink(
          {
            href: basePath + parentUri + node.anchor,
          },
          el
        );
      }

      items.push(
        $.li(
          {},
          $.div({ styles: ["toc_section_title"] }, el),
          ...(node.children
            ? renderTreeNodes(node.children, parentUri, prevlevel + 1)
            : [])
        )
      );
    }

    if (!items.length) {
      return [];
    }

    return [$.ul({}, ...items)];
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
    $.div(
      { styles: ["toc"] },
      ...(tree.caption ? [$.h4({}, tree.caption)] : []),
      ...root
    ),
  ];
}

const literal_block: XMLRenderer = async (node, ctx) => {
  if (ctx.seenLiteralBlockNodes.has(node)) {
    return null;
  }

  const language = node.attrs.language!;
  let code: string | { default: string; [ver: string]: string } =
    node.getText(true);

  const versionedBlocks: { [ver: string]: string } = {};
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

  let captionNode: XMLNode | undefined = undefined;
  if (
    !ctx.ignoreCodeblockCaption &&
    node.parent?.name === "container" &&
    node.parent.attrs["literal_block"] === "True"
  ) {
    captionNode = node.parent.lookupChild("caption");
  }

  const props = {
    language,
    caption:
      captionNode &&
      packRenderNodes(await renderChildren(captionNode.children, ctx)),
    styles: ["rest_border_box", "codeBlock"],
    collapsible,
  };

  return [
    typeof code === "string"
      ? Code({ code, ...props })
      : VersionedCode({ code, ...props }),
  ];
};

async function reference(node: XMLNode, ctx: RenderXMLContext) {
  const refEl = (await _baseReference(node, ctx)) as RenderNode[];

  const attrs = refEl[0].props!;

  if (!attrs.href) return refEl;

  if (ctx.emptyIndexPages?.has(attrs.href.split("#")[0])) {
    throw new Error(
      `Link in page: ${ctx.relname} to skipped empty index page: ${attrs.href}`
    );
  }

  const linkRef = node.attrs.refid
    ? `${ctx.relname}#${node.attrs.refid}`
    : attrs.href;
  const linkVersion =
    ctx.linkVersionMapping?.get(linkRef) ??
    ctx.linkVersionMapping?.get(linkRef.split("#")[0]);

  if (linkVersion) {
    return [
      VersionedLink(
        {
          versionAdded: linkVersion,
        },
        ...refEl
      ),
    ];
  }
  return refEl;
}

async function titleRenderer(node: XMLNode, ctx: RenderXMLContext) {
  const headerLink = (await _titleRenderer(node, ctx))?.[0];
  if (
    headerLink &&
    typeof headerLink !== "string" &&
    headerLink.type === RenderComponentType.HeaderLink
  ) {
    const id = headerLink.props!.id;
    const versionAdded = ctx.linkVersionMapping?.get(
      `${ctx.relname}${ctx.sectionLevel !== 1 ? `#${id}` : ""}`
    );

    ctx.headers.find((h) => h.id === id)!.versionAdded = versionAdded;

    return [
      VersionedHeaderLink(
        { ...(headerLink.props as any), versionAdded },
        ...(headerLink.children as any)
      ),
    ];
  }
  return headerLink ? [headerLink] : null;
}

export const docsRenderers: XMLRendererMap = {
  reference,
  title: async (node, ctx) => {
    if (ctx.sectionLevel !== 1) {
      return titleRenderer(node, ctx);
    }
    return null;
  },
  image: makeImageRenderer("docs", [940, 770], false),
  figure: async (node, ctx) => {
    return createElement(node, $.figure, ctx);
  },
  caption: async (node, ctx) => {
    return createElement(node, $.figcaption, ctx);
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
          $.section(
            { styles: ["sectionIntro"] },
            $.div(
              { styles: ["sectionIntroHeader"] },
              DocIntroIllustration({ name: sectionIntro }),
              ...(titleNode ? (await titleRenderer(titleNode, ctx)) ?? [] : [])
            ),
            ...((await renderChildren(node.children, ctx)) ?? [])
          ),
        ];
      }

      return [
        ...idAnchors,
        ...(titleNode ? (await titleRenderer(titleNode, ctx)) ?? [] : []),
        $.section({}, ...((await renderChildren(node.children, ctx)) ?? [])),
      ];
    } else {
      const sectionContent = await sectionRenderer(node, ctx);
      const versionNode = node.lookupChild("versionmodified");

      if (
        versionNode?.attrs.type === "versionadded" &&
        versionNode.children.length === 0
      ) {
        return [
          VersionedBlock(
            {
              versionAdded: versionNode.attrs.version!,
            },
            ...(sectionContent ?? [])
          ),
        ];
      } else {
        return sectionContent;
      }
    }
  },
  desc: async (node, ctx) => {
    const { objtype, domain } = node.attrs;
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
      DescBlock(
        {
          objtype: objtype!,
          domain: domain!,
          sigs,
          sigIds,
          anno,
          titleSig,
          githubLink: ctx.sourceUrl,
          versionAdded: versionAdded || undefined,
        },
        ...(content ?? [])
      ),
      ...((await renderChildren(node.lookupAllChildren("desc"), ctx)) ?? []),
    ];

    if (versionAdded) {
      return [
        VersionedBlock(
          {
            versionAdded,
          },
          ...descBlock
        ),
      ];
    }
    return descBlock;
  },
  versionmodified: async (node, ctx) => {
    if (
      node.attrs.type === "versionchanged" &&
      node.attrs.version === "_default"
    ) {
      const defaultContent = packRenderNodes(
        await renderChildren(node.children, ctx)
      );
      const versionedContent: {
        version: string;
        content: (string | PackedRenderNode)[];
      }[] = [];

      let index = node.childIndex! + 1;
      while (true) {
        const nextNode = node.parent?.children[index++];
        if (typeof nextNode === "string") {
          if (nextNode.trim() === "") {
            continue;
          }
          break;
        } else if (
          nextNode?.name === "versionmodified" &&
          nextNode.attrs.type === "versionchanged"
        ) {
          versionedContent.push({
            version: nextNode.attrs.version!,
            content: packRenderNodes(
              await renderChildren(nextNode.children, ctx)
            ),
          });
          node.parent?.removeChild(nextNode);
          index--;
          continue;
        }
        break;
      }
      if (versionedContent.length === 0) {
        throw new Error(
          `expected at least one 'versionchanged' block with version after the default block`
        );
      }
      return [VersionedContentReplace({ defaultContent, versionedContent })];
    }

    const versionedNote: (string | RenderNode)[] = [
      VersionedNote(
        {
          versionAdded:
            node.attrs.type === "versionadded" ? node.attrs.version : undefined,
          versionChanged:
            node.attrs.type === "versionchanged"
              ? node.attrs.version
              : undefined,
        },
        ...((await renderChildren(node.children, ctx)) ?? [])
      ),
    ];

    if (node.attrs.type === "versionadded") {
      if (node.children.length) {
        return [
          VersionedBlock(
            {
              versionAdded: node.attrs.version!,
            },
            ...versionedNote
          ),
        ];
      }
      return null;
    }
    return versionedNote;
  },
  literal_block: async (node, ctx) => {
    let childBlock = await literal_block(node, ctx);

    if (!childBlock) {
      return null;
    }

    if (node.attrs.language === "bash") {
      childBlock = [
        $.div(
          {
            styles: ["terminalCodeBlock"],
          },
          ...childBlock
        ),
      ];
    }

    if (
      node.parent?.name === "section" ||
      (node.parent?.name === "container" &&
        node.parent.attrs["literal_block"] === "True" &&
        node.parent.parent?.name === "section")
    ) {
      return [
        $.div(
          {
            styles: ["raisedCodeBlock"],
          },
          ...childBlock
        ),
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
      $.div(
        { styles: ["field"] },
        $.div(
          { styles: ["fieldName"] },
          ...((await renderChildren(fnNode.children, ctx)) ?? [])
        ),
        $.div(
          { styles: ["fieldBody"] },
          ...((await renderChildren(fbNode.children, ctx)) ?? [])
        )
      ),
    ];
  },
  field_list: async (node, ctx) => {
    if (
      node.parent?.parent?.attrs.domain === "py" ||
      node.parent?.parent?.attrs.domain === "js" ||
      node.parent?.parent?.attrs.domain === "dn"
    ) {
      return [
        $.div(
          { styles: ["fields"] },
          ...((await renderChildren(node.children, ctx)) ?? [])
        ),
      ];
    } else {
      return null;
    }
  },
  glossary: async (node, ctx) => {
    return [
      $.div(
        { styles: ["glossary"] },
        ...((await renderChildren(node.children, ctx)) ?? [])
      ),
    ];
  },
  table: async (node, _ctx) => {
    const ctx = { ..._ctx };

    if (node.attrs.classes?.includes("funcoptable")) {
      ctx.renderers = {
        ...ctx.renderers,
        literal: async (node, ctx) => {
          return [
            DescRef({ classes: node.attrs.classes, text: node.getText(true) }),
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
        $.div(
          { styles: ["seealso"] },
          $.div({ styles: ["seealsoSpacer"] }, "︙"),
          $.div({ styles: ["shadowedTable"] }, ...(table ?? []))
        ),
      ];
    }

    if (node.parent?.name === "section") {
      let styles = ["shadowedTable"];
      if (node.attrs.classes?.includes("vertheadertable")) {
        styles.push("vertHeaderTable");
      }

      return [
        $.div(
          {
            styles: styles,
          },
          ...(table ?? [])
        ),
      ];
    } else {
      return table;
    }
  },
};

// export const docsReactRenderers: ReactElementRendererMap = {
//   DocsNavTable: () => <DocsNavTable />,
// };
