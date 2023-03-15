import Link from "next/link";

import styles from "styles/tutorial.module.scss";

import {ParsedMarkdown} from "tutorial/types";

interface TextCellProps {
  content: string | ParsedMarkdown;
}

export default function TextCell({content}: TextCellProps) {
  return typeof content === "string" ? (
    <div
      className={styles.textCell}
      dangerouslySetInnerHTML={{__html: content}}
    />
  ) : (
    <div className={styles.textCell}>
      {content.map((para, i) =>
        typeof para === "string" ? (
          <span key={i} dangerouslySetInnerHTML={{__html: para}} />
        ) : (
          <p key={i}>
            {para.map((block, i) =>
              typeof block === "string" ? (
                <span key={i} dangerouslySetInnerHTML={{__html: block}} />
              ) : (
                <Link key={i} href={block.href}>
                  <a dangerouslySetInnerHTML={{__html: block.html}} />
                </Link>
              )
            )}
          </p>
        )
      )}
    </div>
  );
}
