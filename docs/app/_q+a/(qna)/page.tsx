import Link from "next/link";

import { DiscordIcon } from "@edgedb-site/shared/components/icons";

import { Main } from "@/components/layout";

import { getAllQnAs } from "../_api";

import { QnASearchButton } from "./_components/searchButton";

import styles from "./qna.module.scss";

export default async function QandA() {
  const qnas = await getAllQnAs();

  return (
    <>
      <Main>
        <div className={styles.overviewButtons}>
          <QnASearchButton />
          <Link
            href="https://discord.gg/umUueND6ag"
            className={styles.discordLink}
          >
            <DiscordIcon />
            Join EdgeDB Discord
          </Link>
        </div>

        <h2>Recent Questions</h2>

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
