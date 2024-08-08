import Link from "next/link";

import styles from "./learnCardsWithDesc.module.scss";

interface Card {
  href: string;
  title: string;
  desc: string;
  Icon: any;
}

const Card = ({href, title, desc, Icon}: Card) => (
  <Link href={href}>
    <Icon />
    <div>
      <span className={styles.cardTitle}>{title}</span>
      <p>{desc}</p>
    </div>
    <div className={styles.cardGradient} />
  </Link>
);

interface LearnCardsWithDescProps {
  cards: Card[];
}

const LearnCardsWithDesc = ({cards}: LearnCardsWithDescProps) => (
  <div className={styles.learnCards}>
    {cards.map((card) => (
      <Card {...card} key={card.href} />
    ))}
  </div>
);

export default LearnCardsWithDesc;
