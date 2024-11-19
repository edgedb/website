import { codeBlock, oneLine } from "common-tags";
import { CreateChatCompletionRequest } from "openai";
import { encode } from "gpt-tokenizer";
import { fetchRetry, wait } from "@/components/gpt/utils";
import { errors, summarySeparator } from "@/components/gpt/consts";
import * as edgedb from "edgedb";
import e from "@/dbschema/edgeql-js";

const openAiKey = process.env.OPENAI_KEY;

export const runtime = "edge";
export const preferredRegion = ["cle1"];

const client = edgedb.createHttpClient();

const getSectionsQuery = e.params(
  {
    target: e.OpenAIEmbedding,
    matchThreshold: e.float64,
    matchCount: e.int16,
    minContentLength: e.int16,
  },
  (params) => {
    return e.select(e.Section, (section) => {
      const dist = e.ext.pgvector.cosine_distance(
        section.embedding,
        params.target
      );
      return {
        content: true,
        tokens: true,
        dist,
        filter: e.op(
          e.op(e.len(section.content), ">", params.minContentLength),
          "and",
          e.op(dist, "<", params.matchThreshold)
        ),
        order_by: {
          expression: dist,
          empty: e.EMPTY_LAST,
        },
        limit: params.matchCount,
      };
    });
  }
);

export async function POST(req: Request) {
  try {
    if (!openAiKey) throw new Error("Missing environment variable OPENAI_KEY");
    if (!process.env.EDGEDB_INSTANCE)
      throw new Error("Missing environment variable EDGEDB_INSTANCE");
    if (!process.env.EDGEDB_SECRET_KEY)
      throw new Error("Missing environment variable EDGEDB_SECRET_KEY");

    const requestData = await req.json();

    if (!requestData) throw new Error("Missing request data");

    const { query, context } = requestData;

    if (!query) throw new Error("Missing query in request data");

    // Moderate the content to comply with OpenAI T&C
    const sanitizedQuery = query.trim();

    const moderationResponse = await fetch(
      "https://api.openai.com/v1/moderations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: sanitizedQuery,
        }),
      }
    ).then((res) => res.json());

    // Need this because of "Slow down" OpenAI response.
    const results =
      moderationResponse?.results &&
      moderationResponse.results?.length &&
      moderationResponse.results[0];

    if (results?.flagged) throw new Error(errors.flagged);

    const embeddingResponse = await fetchRetry(
      "https://api.openai.com/v1/embeddings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-ada-002",
          input: sanitizedQuery.replaceAll("\n", " "),
        }),
      },
      3
    );

    const {
      data: [{ embedding }],
      usage: { prompt_tokens },
    } = await embeddingResponse.json();

    const matchThreshold = 0.3;
    const matchCount = 8;
    const minContentLength = 20;

    // const sections = await client.query(
    //   `
    //   with
    //     target := <OpenAIEmbedding>$targetEmbedding,
    //     matchThreshold := <float64>$matchThreshold,
    //     matchCount := <int16>$matchCount,
    //     minContentLength := <int16>$minContentLength

    //   select Section {
    //     content, tokens,
    //     dist := ext::pgvector::cosine_distance(.embedding, target)
    //   }
    //   filter len(.content) > minContentLength and .dist < matchThreshold
    //   order by .dist empty last
    //   limit matchCount`,
    //   {
    //     targetEmbedding: embedding,
    //     matchThreshold,
    //     matchCount,
    //     minContentLength,
    //   }
    // );

    const queryDB = async (retries: number) => {
      try {
        const sections = await getSectionsQuery.run(client, {
          target: embedding,
          matchThreshold,
          matchCount,
          minContentLength,
        });

        return sections;
      } catch (err) {
        if (retries === 1) throw err;

        await wait(500);
        queryDB(retries - 1);
      }
    };

    const sections = (await queryDB(3)) || [];

    let tokenCount = 0;
    let contextText = "";

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const content = section.content;
      tokenCount += section.tokens;

      if (tokenCount >= 1500) {
        tokenCount -= section.tokens;
        break;
      }

      contextText += `${content.trim()}\n---\n`;
    }

    let historyContext = "";
    let newHistoryContext = "";

    if (context.length) {
      // System message is about 400 tokens, we use 500 below just to be sure token limit will never be exceeded.
      // 1500 is left for the answer
      let historyContextAvailableTokens =
        8192 - 1500 - 500 - prompt_tokens - tokenCount;

      let index = context.length - 1;

      while (historyContextAvailableTokens >= 0 && index >= 0) {
        historyContext = newHistoryContext;
        newHistoryContext += `question: ${context[
          index
        ].question.trim()}\nanswer: ${context[index].answer.trim()}\n---\n`;
        const historyTokens = encode(newHistoryContext);

        historyContextAvailableTokens -= historyTokens.length;
        index -= 1;
      }
      if (historyContextAvailableTokens > 0) historyContext = newHistoryContext;
    }

    const prompt = codeBlock`
      ${oneLine`
      As an enthusiastic EdgeDB expert keen to assist, respond to queries in markdown, referencing the given EdgeDB sections and previous history context.
      If a "Learn more" link appears in the context, verify if it starts with "https://www.edgedb.com/".
      If so, append it to the answer, otherwise exclude it.
      Ensure to utilize the "new syntax" in any \`\`\`sdl blocks within the answer, replacing old syntax.
      The new syntax uses "->" over ":", and omits "property" and "link" for non-computed properties/links. See below:
      Old:
      \`\`\`sdl
      type Movie {
        required property title -> str;
        multi link actors -> Person;
      }\`\`\`

      New:
      \`\`\`sdl
      type Movie {
        required title: str;
        multi actors: Person;
      }\`\`\`

      If unable to help based on documentation, respond with: "Sorry, I don't know how to help with that."`}

      EdgeDB sections: """
      ${contextText}
      """

      History context: """
      ${historyContext}
      """

      Question: """
      ${sanitizedQuery}
      """

      Answer in markdown (including related code snippets if available).
      ${
        !historyContext &&
        `After the answer, add a short summary of the question that can be used as a chat title.
        Prefix it with: "${summarySeparator}". The summary should be no more than 35 characters.`
      }
      `;

    const completionOptions: CreateChatCompletionRequest = {
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
      temperature: 0.1,
      stream: true,
    };

    const response = await fetchRetry(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completionOptions),
      },
      3
    );

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
      },
    });
  } catch (error: any) {
    console.error(error);

    const uiError = error.message || errors.default;

    return new Response(uiError, {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
