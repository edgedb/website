import {GetStaticPaths, GetStaticProps} from "next";

import MainLayout from "@/components/layouts/main";

import {
  getAllChapters,
  getChapterByNo,
  ChapterData,
} from "dataSources/easyedb";
import {getChapterUrl} from "dataSources/easyedb/utils";
import {getLangs, getTranslation} from "dataSources/easyedb/translations";
import navData from "@/build-cache/easyedb/en/nav.json";

import styles from "@/styles/easyedb.module.scss";
import rstStyles from "@/components/xmlRenderer/base.module.scss";

import {renderDocument} from "@/components/xmlRenderer";
import {easyedbRenderComponents} from "@/components/xmlRenderer/easyedbComponents";

import {SearchProvider} from "@/components/search";
import {SearchMiniButton, SearchNoteButton} from "@/components/search/buttons";
import Search from "@/components/search/search";

import ClientOnlyPortal from "@/components/NextClientOnlyPortal";
import FooterNav from "@/components/footerNav";
import EasyEDBToc from "@/components/easyedb/toc";
import EasyEDBSectionNav from "@/components/easyedb/sectionNav";
import TagList from "@/components/easyedb/tagList";
import ThemeSwitcher from "@/components/docs/themeSwitcher";
import LazyImage from "@/components/lazyImage";
import MetaTags from "@/components/metatags";
import HeaderLink from "@/components/headerLink";

type PageParams = {
  chapterNo: string[];
};

type PageProps = ChapterData & {
  lang: string;
};

export default function EasyEDBPage({lang, chapter, nav}: PageProps) {
  const tags = navData.find((item) => item.chapterNo === chapter.chapterNo)!
    .tags;

  const description =
    chapter.firstParagraph.length > 180
      ? `${chapter.firstParagraph.slice(0, 179)}…`
      : chapter.firstParagraph;

  return (
    <SearchProvider>
      <MainLayout
        className={styles.page}
        pageBackgroundColour={{light: "#f7f7f7", dark: "#2c2d2e"}}
        footerClassName={styles.footer}
        headerInjectComponent={
          <div className={styles.searchButtons}>
            <SearchNoteButton />
            <SearchMiniButton />
          </div>
        }
      >
        <MetaTags
          title={
            chapter.chapterNo === 0
              ? `Easy EdgeDB - The illustrated textbook`
              : `${chapter.chapterName} — ${chapter.title} | Easy EdgeDB`
          }
          description={description}
          imagePath={
            chapter.leadImage ? chapter.leadImage.path + ".jpg" : undefined
          }
          relPath={getChapterUrl(chapter.chapterNo, lang)}
        />
        <div className="globalPageWrapper">
          <ClientOnlyPortal targetId="themeSwitcherPortalTarget">
            <ThemeSwitcher className={styles.themeSwitcher} />
          </ClientOnlyPortal>
          <div className={styles.toc}>
            <EasyEDBToc lang={lang} currentChapter={chapter.chapterNo} />
          </div>
          <div className={styles.pageContent}>
            <div className={styles.chapterNo}>
              {getTranslation(lang, "Easy EdgeDB")} · {chapter.chapterName}
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

            <div className={styles.chapterContent}>
              {renderDocument(
                chapter.document,
                styles,
                easyedbRenderComponents
              )}
            </div>

            <FooterNav className={styles.chapterFooterNav} nav={nav} />
          </div>
          <div className={styles.sectionNav}>
            <EasyEDBSectionNav
              headers={chapter.headers}
              sectionSelector={`.${rstStyles.rstWrapper} section .${styles.section}`}
            />
          </div>
        </div>
      </MainLayout>
      <Search defaultIndexId="easyedb" />
    </SearchProvider>
  );
}

export const getStaticPaths: GetStaticPaths<PageParams> = async () => {
  return {
    paths: (
      await Promise.all(
        getLangs().map(async (lang) =>
          (await getAllChapters(lang)).map((chapter) => ({
            params: {
              chapterNo: [
                ...(lang === "en" ? [] : [lang]),
                chapter.chapterNo === 0 ? "" : `chapter${chapter.chapterNo}`,
              ],
            },
          }))
        )
      )
    ).flat(),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PageProps, PageParams> = async (
  ctx
) => {
  const langs = getLangs();
  let [lang, chapter] = ctx.params!.chapterNo
    ? langs.includes(ctx.params!.chapterNo[0])
      ? ctx.params!.chapterNo
      : ["en", ...ctx.params!.chapterNo]
    : ["en", ""];
  const chapterNo = chapter ? parseInt(chapter.slice(7), 10) : 0;

  return {
    props: {
      ...(await getChapterByNo(chapterNo, lang)),
      lang,
    },
  };
};
