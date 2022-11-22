import {XMLNode} from "@edgedb/site-build-tools/xmlutils";
import {packRenderNodes, XMLRendererMap} from ".";
import {PackedRenderNode, RenderComponent} from "./interfaces";
import {
  literal_block,
  makeImageRenderer,
  titleRenderer,
} from "./baseRenderers";
import {
  createElement,
  renderChildren,
  toAbsoluteURI,
  createNullRenderers,
} from "./utils";
import {getTranslation} from "../../dataSources/easyedb/translations";

export const easyEDBRenderers: XMLRendererMap = {
  title: async (node, ctx) => {
    if (ctx.sectionLevel === 1) {
      // Don't render the h1; we render it manually in another place
      return null;
    }

    return titleRenderer(node, ctx);
  },
  image: makeImageRenderer("easyedb", [830, 750, 680]),
  reference: (node, ctx) => {
    const nodeText = node.getAllText().trim();
    if (nodeText.startsWith("``") && nodeText.endsWith("``")) {
      // @ts-ignore
      node._children = [new XMLNode("literal", {}, [nodeText.slice(2, -2)])];
    }

    if (node.attrs.internal?.toLowerCase() === "true") {
      let href = node.attrs.refid
        ? `#${node.attrs.refid}`
        : toAbsoluteURI(node.attrs.refuri!, ctx);

      // if link to another chapter, strip '/index' from path
      if (/chapter\d+\/index$/.test(href)) {
        href = href.slice(0, -6);
      }

      return createElement(
        node,
        node.attrs.refid ? "a" : RenderComponent.NextLink,
        ctx,
        {href}
      );
    } else {
      return createElement(node, "a", ctx, {
        href: node.attrs.refuri,
      });
    }
  },
  quiz: async (node, ctx) => {
    const quizAnswersNode: XMLNode = ctx.customData.getQuizAnswers();

    const questionItems = (node.children[0] as XMLNode).lookupChildren(
      "list_item"
    );

    const answerSections = quizAnswersNode
      .lookupChild("section")
      ?.lookupAllChildren("section");

    if (questionItems.length !== answerSections?.length) {
      throw new Error(
        `Question -> Answer mismatch: ${questionItems.length} questions, ${answerSections?.length} answers`
      );
    }

    const childCtx = {
      ...ctx,
      renderers: {...ctx.renderers, literal_block},
    };

    const quizItems: {
      question: (PackedRenderNode | string)[];
      answer: (PackedRenderNode | string)[];
    }[] = await Promise.all(
      questionItems.map(async (questionItem, i) => {
        return {
          question: packRenderNodes(
            await renderChildren(questionItem.children, childCtx)
          ),
          answer: packRenderNodes(
            await renderChildren(
              answerSections[i].children.filter(
                (node) => node instanceof XMLNode && node.name !== "title"
              ),
              childCtx
            )
          ),
        };
      })
    );

    const sectionId = node.parent?.attrs.ids?.split(" ")[0] ?? "";
    if (!sectionId) {
      throw new Error("Cannot find section id for quiz block");
    }

    ctx.headers.push({
      id: sectionId,
      title: getTranslation(ctx.lang ?? "en", "Practice Time"),
      level: ctx.sectionLevel,
    });

    return [
      {
        type: RenderComponent.EasyEDBQuiz,
        props: {
          lang: ctx.lang,
          items: quizItems,
          sectionId,
          key: ctx.relname,
        },
      },
    ];
  },
  literal_block: async (node, ctx) => {
    return [
      {
        type: "div",
        props: {
          styles: ["raisedCodeBlock"],
        },
        children: await literal_block(node, ctx),
      },
    ];
  },
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
          type: "div",
          children: [
            {
              type: "pre",
              children: [node.getText()],
            },
          ],
        },
      ];
    }
  },
  ...createNullRenderers(["hidden"]),
};
