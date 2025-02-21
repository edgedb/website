import { Metadata } from "next";

import { Main, RightSidebar } from "@/components/layout";

import { easyedbRenderComponents } from "@/components/xmlRenderer/easyedbComponents";

import { getAllChapters, getChapterByNo } from "@/dataSources/easyedb";
import { getLangAndChapterNo } from "@/dataSources/easyedb/utils";
import { getLangs, getTranslation } from "@/dataSources/easyedb/translations";

import navData from "@/build-cache/easyedb/en/nav.json";

import { renderDocument } from "@edgedb-site/shared/xmlRenderer";
import docsStyles from "@/app/docs.module.scss";

import styles from "./easyedb.module.scss";

import FooterNav from "@/components/footerNav";
import { DocsToC } from "@/components/docsToc";
import HeaderLink from "@edgedb-site/shared/components/headerLink";
import TagList from "@/components/easyedb/tagList";
import LazyImage from "@edgedb-site/shared/components/lazyImage";

export const dynamic = "force-static";
export const dynamicParams = false;

interface Props {
  params: { chapterNo?: string[] };
}

export default async function EasyEDBBook({ params }: Props) {
  const { chapterNo, lang } = getLangAndChapterNo(params.chapterNo);
  const { nav, chapter } = await getChapterByNo(chapterNo, lang);

  const tags = navData.find((item) => item.chapterNo === chapter.chapterNo)!
    .tags;

  return (
    <>
      <Main className={styles.pageContent}>
        <div className={styles.chapterNo}>
          {getTranslation(lang, "Easy EdgeDB")}
          <span> · </span>
          {chapter.chapterName}
        </div>
        <HeaderLink
          id={`chapter${chapter.chapterNo}`}
          githubLink={`https://github.com/edgedb/easy-edgedb/blob/master/${
            lang !== "en" ? `translations/${lang}/` : ""
          }chapter${chapter.chapterNo}/index.md`}
        >
          {chapter.title}
        </HeaderLink>
        <TagList className={styles.chapterTags} tags={tags} />
        {chapter.leadImage ? (
          <LazyImage
            key={`leadImage${chapter.chapterNo}`}
            className={styles.leadImage}
            url={chapter.leadImage.path}
            width={chapter.leadImage.width}
            height={chapter.leadImage.height}
            thumbnail={chapter.leadImage.thumbnail}
            widths={[1024, 920, 720]}
            sizes={{
              default: 1120,
              xl: 940,
              lg: 840,
              md: 680,
              sm: "100vw",
            }}
          />
        ) : null}

        {renderDocument(chapter.document, docsStyles, easyedbRenderComponents)}

        <FooterNav className={styles.chapterFooterNav} nav={nav} />
      </Main>
      <RightSidebar>
        <DocsToC
          headers={chapter.headers}
          sectionSelector={`.${docsStyles.section}`}
        />
      </RightSidebar>
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chapterNo, lang } = getLangAndChapterNo(params.chapterNo);
  const { chapter } = await getChapterByNo(chapterNo, lang);

  const description =
    chapter.firstParagraph.length > 180
      ? `${chapter.firstParagraph.slice(0, 179)}…`
      : chapter.firstParagraph;

  return {
    title:
      chapter.chapterNo === 0
        ? `Easy EdgeDB - The illustrated textbook`
        : `${chapter.chapterName} — ${chapter.title} | Easy EdgeDB`,
    description,
  };
  // imagePath={
  //   chapter.leadImage ? chapter.leadImage.path + ".jpg" : undefined
  // }
  // relPath={getChapterUrl(chapter.chapterNo, lang)}
}

export async function generateStaticParams() {
  return (
    await Promise.all(
      getLangs().map(async (lang) =>
        (await getAllChapters(lang)).map((chapter) => ({
          chapterNo: [
            ...(lang === "en" ? [] : [lang]),
            chapter.chapterNo === 0 ? "" : `chapter${chapter.chapterNo}`,
          ],
        }))
      )
    )
  ).flat();
}
