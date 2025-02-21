import {
  buildSearchIndex,
  markdownToRawText,
  summarify,
} from "@edgedb-site/build-tools/searchUtils";

import { getAllQnAs } from "../../_api";

export async function GET() {
  const qnaData = await getAllQnAs();

  const indexData = await buildSearchIndex((builder) => {
    for (const data of qnaData) {
      const question = markdownToRawText(data.question);
      const answer = markdownToRawText(data.answer);

      builder.addDocument({
        relname: `/${data.slug}`,
        type: "qna",
        title: data.title,
        content: question + " " + answer,
        summary: summarify(question),
      });
    }
  });

  return new Response(indexData, {
    headers: { "Content-Encoding": "gzip", "Content-Type": "application/json" },
  });
}
