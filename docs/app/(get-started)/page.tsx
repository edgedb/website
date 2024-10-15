import ExpandingArrow from "@edgedb-site/shared/components/expandingArrow";
import { Main } from "@/components/layout";
import { DocsLink } from "@/dataSources/validateLink";
import { tutorials } from "../guides/content";
import { languages } from "../libraries/content";
import { getStartedIntro, getStartedUrls } from "./content";
import styles from "../docs.module.scss";

export default function GetStarted() {
  return (
    <Main className={styles.indexPage}>
      <h1>Welcome to the EdgeDB docs!</h1>
      <div className={styles.getStarted}>
        <div className={styles.introBlock}>
          {getStartedIntro.map((paragraph) => paragraph)}
        </div>
        <div className={styles.linksBlock}>
          {getStartedUrls.map(({ icon, title, desc, url }) => (
            <div key={url} className={styles.link}>
              <DocsLink href={url}>
                <div>
                  {icon} <span>{title}</span>
                  <ExpandingArrow
                    strokeWidth={2}
                    height={10}
                    width={16}
                    expandBy={8}
                    className={styles.guideArrow}
                  />
                </div>
                <p>{desc}</p>
              </DocsLink>
            </div>
          ))}
        </div>
      </div>
      <section>
        <h2>Works with your favorite language</h2>
        <div className={styles.clientsLanguages}>
          {languages.map(({ icon, url }) => (
            <DocsLink href={url} key={url} className={styles.logoWrapper}>
              {icon}
            </DocsLink>
          ))}
        </div>
      </section>
      <section>
        <h2>Works with your favorite framework</h2>
        <div className={styles.tutorials}>
          {tutorials.map(({ icon, url, target }) => (
            <DocsLink
              href={url}
              key={url}
              className={styles.tutorialLogo}
              target={target}
            >
              {icon}
            </DocsLink>
          ))}
        </div>
      </section>
    </Main>
  );
}
