import {GetStaticProps, GetStaticPaths} from "next";
import Head from "next/head";
import Link from "next/link";

import cn from "@edgedb-site/shared/utils/classNames";

import MainLayout from "@/components/layouts/main";

import {ArrowLeftIcon} from "@/components/icons";

import {getAllPositions, getPosition, Position} from "dataSources/careers";

import styles from "@/styles/careers.module.scss";
import MetaTags from "@/components/metatags";

type PageParams = {
  id: string;
};

type PageProps = Position;

export default function CareerPositionPage({
  title,
  location,
  content,
  id,
}: PageProps) {
  return (
    <MainLayout
      className={cn(styles.page, styles.detailsPage)}
      footerClassName={styles.pageFooter}
    >
      <MetaTags
        title={`${title} — Careers`}
        description={`We're hiring a ${title} to work ${
          location === "Remote" ? "remotely" : `in ${location}`
        }.`}
        relPath={`/careers/${id}`}
      />
      <div className={styles.balloonsWrapper}>
        <div className={styles.balloons}>
          {Array(7)
            .fill(0)
            .map((_, i) => (
              <div key={i} />
            ))}
        </div>
      </div>
      <div className="globalPageWrapper">
        <div className={styles.content}>
          <h1 className={styles.title}>Join the Team</h1>

          <Link href="/careers" className={styles.backButton}>
            <ArrowLeftIcon />
            Back to Careers
          </Link>

          <h2 className={styles.jobTitle}>{title}</h2>
          <div className={styles.jobLocation}>{location}</div>

          <div
            className={styles.jobDescription}
            dangerouslySetInnerHTML={{__html: content}}
          />

          <a
            className={styles.applyButton}
            href={`mailto:jobs@edgedb.com?subject=${title}`}
          >
            Apply
          </a>
        </div>
      </div>
    </MainLayout>
  );
}

export const getStaticPaths: GetStaticPaths<PageParams> = async () => {
  const positions = await getAllPositions();

  return {
    paths: positions.map((position) => ({
      params: {id: position.id},
    })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PageProps, PageParams> = async (
  ctx
) => {
  return {
    props: await getPosition(ctx.params!.id),
  };
};
