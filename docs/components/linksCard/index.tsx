import styles from "./linksCard.module.scss";
import { DocsLink } from "@/dataSources/validateLink";

interface LinksCardProps {
  title: string;
  links: {
    title: string;
    url: string;
  }[];
}

export default function LinksCard({ links, title }: LinksCardProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      {links.map(({ title, url }) => (
        <DocsLink href={url} key={url} className={styles.item}>
          {title}
        </DocsLink>
      ))}
    </div>
  );
}
