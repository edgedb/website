import Link from "next/link";

import ExpandingArrow from "@edgedb-site/shared/components/expandingArrow";
import styles from "./learnCards.module.scss";

interface Card {
  href: string;
  title: string;
  classes?: string;
}

const Card = ({href, title, classes}: Card) => (
  <Link href={href} className={classes}>
    <div className={styles.cardContent}>
      <span className={styles.cardTitle}>{title}</span>
      <ExpandingArrow strokeWidth={3} height={16} width={30} expandBy={8} />
      <div className={styles.cardBackground}></div>
    </div>
    <div className={styles.cardGradient} />
  </Link>
);

interface LearnCardsProps {
  cards: Card[];
}

const LearnCards = ({cards}: LearnCardsProps) => {
  const cardsLength = cards.length;
  const isLastRowCentered = cardsLength % 3 === 1;

  return (
    <div className={styles.learnCards}>
      {cards.map((card, i) => (
        <Card
          key={card.href}
          {...card}
          classes={
            isLastRowCentered && i === cardsLength - 1 ? styles.skipColumn : ""
          }
        />
      ))}
    </div>
  );
};

export default LearnCards;
