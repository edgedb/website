import cn from "@edgedb-site/shared/utils/classNames";

import styles from "./blogAuthors.module.scss";

interface Author {
  id: string;
  name: string;
  github?: string;
  twitter?: string;
  avatarUrl?: string;
}

interface PostAuthorsProps {
  authors: Author[];
  minimal?: boolean;
  className?: string;
}

export default function PostAuthors({
  authors,
  minimal,
  className,
}: PostAuthorsProps) {
  if (minimal) {
    return (
      <div className={cn(styles.postAuthors, className)}>
        {authors
          .flatMap((author) => [
            <span key={author.id} className={styles.name}>
              {author.name}
            </span>,
            <span key={author.id + "sep"} className={styles.sep}>
              ,{" "}
            </span>,
          ])
          .slice(0, -1)}
      </div>
    );
  }
  return (
    <div className={styles.postAuthorCards}>
      {authors.map((author) => (
        <AuthorCard key={author.id} author={author} />
      ))}
    </div>
  );
}

function AuthorCard({author}: {author: Author}) {
  const profileName = author.twitter ?? author.github;

  return (
    <div className={styles.authorCard}>
      {author.avatarUrl ? <img src={author.avatarUrl} /> : null}
      <div className={styles.authorDetails}>
        <span>{author.name}</span>
        {profileName ? (
          <a
            href={
              author.twitter
                ? `https://twitter.com/${author.twitter}`
                : `https://github.com/${author.github}`
            }
            target="_blank"
            className={styles.profileName}
          >
            @{profileName}
          </a>
        ) : null}
      </div>
    </div>
  );
}
