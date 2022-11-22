import cn from "@/utils/classNames";
import Link from "next/link";
import {
  LearnBookIcon,
  LearnDocsIcon,
  LearnRocketIcon,
  LearnTutorialIcon,
} from "../icons/learn";

import styles from "./learnCards.module.scss";

interface LearnCardsProps {
  cards?: {
    quickstart?: true;
    tutorial?: true;
    easy_edgedb?: true;
    docs?: true;
  };
}

export default function LearnCards(props: LearnCardsProps) {
  const cards = props.cards || {
    quickstart: true,
    tutorial: true,
    easy_edgedb: true,
    docs: true,
  };
  return (
    <div className={styles.learnCards}>
      {cards.quickstart && (
        <Link href="/docs/guides/quickstart">
          <a>
            <LearnRocketIcon />
            <div>
              <span className={styles.cardTitle}>5-min Quickstart</span>
              <p>
                Install EdgeDB, create a simple schema, and write your first
                queries in under 5 minutes.
              </p>
            </div>
            {/* <ExpandingArrow /> */}
            <div className={styles.cardGradient} />
          </a>
        </Link>
      )}

      {cards.tutorial && (
        <Link href="/tutorial">
          <a>
            <LearnTutorialIcon />
            <div>
              <span className={styles.cardTitle}>
                Interactive EdgeQL Tutorial
              </span>
              <p>
                The quickest way to learn the key concepts of EdgeDB without
                installation, right in your browser.
              </p>
            </div>
            {/* <ExpandingArrow /> */}
            <div className={styles.cardGradient} />
          </a>
        </Link>
      )}
      {cards.easy_edgedb && (
        <Link href="/easy-edgedb">
          <a>
            <LearnBookIcon />
            <div>
              <span className={styles.cardTitle}>Easy EdgeDB Book</span>
              <p>
                An easy to follow book about using EdgeDB for an imaginary game
                based on the setting in Bram Stoker's 1897 book Dracula.
              </p>
            </div>
            {/* <ExpandingArrow /> */}
            <div className={styles.cardGradient} />
          </a>
        </Link>
      )}
      {cards.docs && (
        <Link href="/docs">
          <a>
            <LearnDocsIcon />
            <div>
              <span className={styles.cardTitle}>Documentation</span>
              <p>
                An in-depth look at everything there is to know about EdgeDB:
                data types, query language, schema and database setup, etc.
              </p>
            </div>
            {/* <ExpandingArrow /> */}
            <div className={styles.cardGradient} />
          </a>
        </Link>
      )}
    </div>
  );
}
