export function getChapterUrl(chapterNo: number, lang: string) {
  return `/easy-edgedb${lang === "en" ? "" : `/${lang}`}${
    chapterNo === 0 ? "" : `/chapter${chapterNo}`
  }`;
}
