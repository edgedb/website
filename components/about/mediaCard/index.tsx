import styles from "./mediaCard.module.scss";

export interface Article {
  platform: string;
  type: string;
  date: string;
  desc: string;
  link: string;
}

const MediaCard = ({platform, date, desc, type, link}: Article) => (
  <a className={styles.container} href={link}>
    <p className={styles.platform}>
      {platform}
      <span>{type}</span>
    </p>
    <p className={styles.date}>{date}</p>
    <p>{desc}</p>
  </a>
);

export default MediaCard;
