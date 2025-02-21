import { getLangs } from "./translations";

export function getChapterUrl(chapterNo: number, lang: string) {
  return `/easy-edgedb${lang === "en" ? "" : `/${lang}`}${
    chapterNo === 0 ? "" : `/chapter${chapterNo}`
  }`;
}

export function getLangAndChapterNo(path: string[] | undefined) {
  const langs = getLangs();
  let [lang, chapterNoStr] = path
    ? langs.includes(path[0])
      ? path
      : ["en", ...path]
    : ["en", ""];
  const chapterNo = chapterNoStr ? parseInt(chapterNoStr.slice(7), 10) : 0;

  return { lang, chapterNo };
}
