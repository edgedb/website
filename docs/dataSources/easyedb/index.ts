import { PromiseType } from "@edgedb-site/shared/utils/typing";
import { BookChapter, QuizAnswers } from "@/dataBuild/interfaces";

import { getSourceData, pick } from "../utils";
import { getChapterUrl } from "./utils";
import { getLangs } from "./translations";

const getChapterData = (lang: string) =>
  getSourceData(["easyedb", lang, "chapters"]).catch((err) => {
    if (process.env.NODE_ENV === "production" || lang === "en") {
      throw err;
    }
    return { chapters: [], answers: [] };
  }) as Promise<{
    chapters: BookChapter[];
    answers: QuizAnswers[];
  }>;

const getSortedChapters = async (lang: string) => {
  return (await getChapterData(lang)).chapters.sort(
    (a, b) => a.chapterNo - b.chapterNo
  );
};

export async function getAllChapters(lang: string) {
  return (await getSortedChapters(lang)).map((chapter) => ({
    ...pick(chapter, ["chapterNo", "title"]),
  }));
}

export type AllChapters = PromiseType<ReturnType<typeof getAllChapters>>;

export async function getChapterByNo(chapterNo: number, lang: string) {
  const allChapters = await getSortedChapters(lang);

  const chapterIndex = allChapters.findIndex(
    (chapter) => chapter.chapterNo === chapterNo
  )!;

  const chapter = allChapters[chapterIndex];
  const nextChapter = allChapters[chapterIndex - 1];
  const prevChapter = allChapters[chapterIndex + 1];

  return {
    chapter: {
      ...pick(chapter, [
        "chapterNo",
        "chapterName",
        "title",
        "headers",
        "firstParagraph",
        "document",
        "leadImage",
      ]),
    },
    nav: {
      prev: nextChapter
        ? {
            title: nextChapter.title,
            url: getChapterUrl(nextChapter.chapterNo, lang),
            label: nextChapter.chapterName,
          }
        : null,
      next: prevChapter
        ? {
            title: prevChapter.title,
            url: getChapterUrl(prevChapter.chapterNo, lang),
            label: prevChapter.chapterName,
          }
        : null,
    },
  };
}

export type ChapterData = PromiseType<ReturnType<typeof getChapterByNo>>;
export type Chapter = ChapterData["chapter"];
