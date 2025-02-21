import Link from "next/link";

import { Main, RightSidebar } from "@/components/layout";

import _Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Code } from "@edgedb-site/shared/components/code";

import { getQnA } from "../../_api";

import styles from "../qna.module.scss";
import docsStyles from "@/app/docs.module.scss";

function Markdown({ content }: { content: string }) {
  return (
    <_Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: ({ inline, className, children }) => (
          <Code
            code={children.toString()}
            language={className?.replace(/^language-/, "") ?? ""}
            inline={inline}
            className={styles.codeBlock}
          />
        ),
      }}
    >
      {content}
    </_Markdown>
  );
}

export default async function QandA({ params }: { params: { slug: string } }) {
  const { question, answer, tags, title } = await getQnA(params.slug);

  return (
    <>
      <Main>
        <div className={docsStyles.rstWrapper}>
          <h1>{title}</h1>

          <div className={styles.questionBlock}>
            <h2>Question</h2>
            <Markdown content={question} />
          </div>

          <Markdown content={answer} />
        </div>
      </Main>
      <RightSidebar>
        <div className={styles.tagsList}>
          {tags.map((tag) => (
            <Link key={tag} href={`/q+a/tags/${tag}`}>
              #{tag}
            </Link>
          ))}
        </div>
      </RightSidebar>
    </>
  );
}
