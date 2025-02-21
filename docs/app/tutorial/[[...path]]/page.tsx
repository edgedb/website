import { Metadata } from "next";
import { Main } from "@/components/layout";

import Link from "next/link";

import { CodeCellData } from "@edgedb-site/shared/tutorial/types";
import { TutorialControls } from "@/components/tutorial/controls";
import { getTutorialPage, getTutorialPaths } from "@/dataSources/tutorial";

import styles from "@/components/tutorial/tutorial.module.scss";
import TextCell from "@/components/tutorial/textcell";
import { TutorialPageStateProvider } from "@edgedb-site/shared/tutorial/state";
import { CodeCell } from "@edgedb-site/shared/components/tutorial/codecell";
import { TutorialCellsWrapper } from "@/components/tutorial/cellsWrapper";
import FooterNav from "@/components/tutorial/footerNav";

export const dynamic = "force-static";
export const dynamicParams = false;

{
  /* <MetaTags
description={`Try EdgeDB directly from your browser! No installations required.`}
relPath={`/tutorial/${page.path}`}
/> */
}

type PageProps = {
  params: { path?: string[] };
};

export default async function TutorialPages({ params }: PageProps) {
  const {
    page,
    category,
    prefetchedData,
    protocolVersion,
    nextPage,
    prevPage,
  } = await getTutorialPage(params.path ?? []);

  const codeCells = page.cells.filter(
    (cell) => cell.kind === "edgeql"
  ) as CodeCellData[];

  return (
    <TutorialPageStateProvider
      pageId={page.id}
      prefetchedData={prefetchedData}
      protocolVersion={protocolVersion}
      codeCells={codeCells}
    >
      <Main>
        <div className={styles.content}>
          <h1>{category.title}</h1>

          {category.pages.length > 1 ? (
            <>
              <div className={styles.subtopicsHeader}>Subtopics</div>
              <nav className={styles.pageNav}>
                {category.pages.map((catPage) =>
                  catPage.slug === page.slug ? (
                    <span className={styles.activeNav} key={catPage.slug}>
                      {catPage.title}
                    </span>
                  ) : (
                    <Link
                      href={`/tutorial/${catPage.relname}`}
                      key={catPage.slug}
                    >
                      {catPage.title}
                    </Link>
                  )
                )}
              </nav>
            </>
          ) : null}

          {prevPage === null ? (
            <div className={styles.introIllustration} />
          ) : null}

          <TutorialCellsWrapper>
            {page.cells.map((cell, i) =>
              cell.kind === "text" ? (
                <TextCell key={i} content={cell.text} />
              ) : (
                <CodeCell
                  className={styles.codeCell}
                  key={i}
                  cellId={codeCells.indexOf(cell)}
                />
              )
            )}
          </TutorialCellsWrapper>

          <FooterNav
            prev={
              prevPage
                ? {
                    url: `/tutorial/${prevPage.path}`,
                  }
                : null
            }
            next={
              nextPage
                ? {
                    url: `/tutorial/${nextPage.path}`,
                    categoryTitle: nextPage.categoryTitle,
                  }
                : null
            }
          />
        </div>

        <TutorialControls />
      </Main>
    </TutorialPageStateProvider>
  );
}

export async function generateStaticParams() {
  return await getTutorialPaths();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { page, category } = await getTutorialPage(params.path ?? []);

  return {
    title: params.path
      ? `${page.title} - ${category.title} | Tutorial`
      : "Interactive Tutorial",
  };
}
