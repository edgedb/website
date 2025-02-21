const translations = {
  en: {
    "Easy EdgeDB": "Easy EdgeDB",
    "Practice Time": "Practice Time",
    "Show answer": "Show answer",
    "Hide answer": "Hide answer",
  },
  zh: {
    "Easy EdgeDB": "《EdgeDB 易经》",
    "Practice Time": "小测验",
    "Show answer": "查看答案",
    "Hide answer": "收起答案",
  },
};

export function getLangs(): string[] {
  return Object.keys(translations);
}

export function getTranslation(lang: string, key: string): string {
  const str = (translations as any)[lang]?.[key];
  if (!str) {
    throw new Error(
      `No translation found for key: '${key}' and lang: '${lang}'`
    );
  }
  return str;
}
