import {useState} from "react";

import cn from "@/utils/classNames";
import {getTranslation} from "dataSources/easyedb/translations";

import styles from "./easyedbQuiz.module.scss";

interface EasyEDBQuizProps {
  lang?: string;
  items: {question: JSX.Element; answer: JSX.Element}[];
  sectionId: string;
}

export default function EasyEDBQuiz({
  lang,
  items,
  sectionId,
}: EasyEDBQuizProps) {
  const [openedAnswers, setOpenedAnswers] = useState(
    Array(items.length).fill(false) as boolean[]
  );

  function toggleAnswer(index: number) {
    const opened = [...openedAnswers];
    opened[index] = !opened[index];
    setOpenedAnswers(opened);
  }

  return (
    <>
      <div id={sectionId} className={styles.title}>
        <PracticeIcon />
        <span>{getTranslation(lang ?? "en", "Practice Time")}</span>
      </div>
      <ol className={styles.quiz}>
        {items.map((item, i) => (
          <li
            key={i}
            className={cn({
              [styles.open]: openedAnswers[i],
            })}
          >
            <div className={styles.question}>
              <div>{item.question}</div>
            </div>
            {openedAnswers[i] ? (
              <div className={styles.answer}>
                <div>{item.answer}</div>
              </div>
            ) : null}
            <div
              className={styles.toggleAnswer}
              onClick={() => toggleAnswer(i)}
            >
              {getTranslation(
                lang ?? "en",
                `${openedAnswers[i] ? "Hide" : "Show"} answer`
              )}
              <ExpandArrow />
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function ExpandArrow() {
  return (
    <svg
      width="8"
      height="7"
      viewBox="0 0 8 7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.13397 6.5C3.51887 7.16667 4.48113 7.16667 4.86603 6.5L7.4641 2C7.849 1.33333 7.36788 0.5 6.59808 0.5H1.40192C0.632124 0.5 0.150998 1.33333 0.535898 2L3.13397 6.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PracticeIcon() {
  return (
    <svg
      width="112"
      height="112"
      viewBox="0 0 112 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M56 112C86.9283 112 112 86.9279 112 56C112 25.0721 86.9283 0 56 0C25.0717 0 0 25.0721 0 56C0 86.9279 25.0717 112 56 112ZM25.064 57.2375C23.014 59.2877 23.014 62.6118 25.064 64.6622L47.338 86.936C49.3879 88.9862 52.7119 88.9862 54.7627 86.936C56.8126 84.8857 56.8126 81.5617 54.7627 79.5114L32.4886 57.2375C30.4387 55.1872 27.1139 55.1872 25.064 57.2375ZM63.4247 43.6257L68.3739 48.5755L48.5753 68.3745L43.6252 63.4247L63.4247 43.6257ZM57.2373 25.064C55.1874 27.1143 55.1874 30.4387 57.2373 32.4886L79.5114 54.7627C81.5613 56.8128 84.8853 56.8128 86.936 54.7627C88.986 52.7123 88.986 49.3884 86.936 47.338L64.662 25.064C62.6121 23.014 59.2872 23.014 57.2373 25.064ZM21.3521 75.799C19.9849 74.4323 19.9849 72.2161 21.3521 70.8494C22.7184 69.4824 24.9349 69.4824 26.3013 70.8494L41.1506 85.6985C42.5178 87.0655 42.5178 89.2814 41.1506 90.6484C39.7834 92.0151 37.5677 92.0151 36.2006 90.6484L21.3521 75.799ZM70.8494 21.3521C69.4822 22.7188 69.4822 24.9349 70.8494 26.3017L85.6987 41.1508C87.0651 42.5176 89.2816 42.5176 90.6479 41.1508C92.0151 39.7841 92.0151 37.5677 90.6479 36.201L75.7986 21.3521C74.4323 19.9849 72.2157 19.9849 70.8494 21.3521ZM84.4606 25.064C83.7778 24.3808 83.7778 23.2725 84.4606 22.5894C85.1442 21.9058 86.2524 21.9058 86.936 22.5894L89.4106 25.064C90.0942 25.7476 90.0942 26.8554 89.4106 27.539C88.7271 28.2226 87.6196 28.2226 86.936 27.539L84.4606 25.064ZM22.5894 84.4612C21.9058 85.1446 21.9058 86.2527 22.5894 86.936L25.064 89.4109C25.7476 90.0942 26.8558 90.0942 27.5386 89.4109C28.2222 88.7275 28.2222 87.6194 27.5386 86.936L25.064 84.4612C24.3804 83.7776 23.2721 83.7776 22.5894 84.4612Z"
      />
    </svg>
  );
}
