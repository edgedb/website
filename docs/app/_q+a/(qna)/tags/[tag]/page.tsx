import Link from "next/link";

import { Main } from "@/components/layout";

import { getQnAsByTag } from "../../../_api";

import styles from "../../qna.module.scss";

export default async function QandA({ params }: { params: { tag: string } }) {
  const qnas = await getQnAsByTag(params.tag);

  return (
    <>
      <Main>
        <div className={styles.questionList}>
          {qnas.map((qna) => (
            <Link key={qna.slug} href={`/q+a/${qna.slug}`}>
              {qna.title}
            </Link>
          ))}
        </div>
      </Main>
    </>
  );
}
