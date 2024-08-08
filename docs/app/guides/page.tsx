import { Main } from "@/components/layout";
import ExpandingArrow from "@edgedb-site/shared/components/expandingArrow";
import { DocsLink } from "@/dataSources/validateLink";

import {
  deployment,
  guides,
  tutorials,
} from "./content";
import styles from "../docs.module.scss";

export default function GuidesPage() {
  return (
    <Main className={styles.indexPage}>
      <h1>EdgeDB guides & tutorials</h1>
      <p>
        Our guides demonstrate how to use many of EdgeDB's advanced features.
        Our tutorials will guide you through building a complete app using
        popular technologies.
      </p>
      <section>
        <h2>Guides</h2>
        <div className={styles.guides}>
          <div>
            {guides.slice(0, 3).map(({ title, url, content }) => (
              <div key={url}>
                <DocsLink href={url}>
                  {title}{" "}
                  <ExpandingArrow
                    strokeWidth={2}
                    height={10}
                    width={16}
                    expandBy={8}
                    className={styles.guideArrow}
                  />
                  <p>{content}</p>
                </DocsLink>
              </div>
            ))}
          </div>
          <div>
            {guides.slice(3).map(({ title, url, content }) => (
              <div key={url}>
                <DocsLink href={url}>
                  {title}{" "}
                  <ExpandingArrow
                    strokeWidth={2}
                    height={10}
                    width={16}
                    expandBy={8}
                    className={styles.guideArrow}
                  />
                  <p>{content}</p>
                </DocsLink>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section>
        <h2>Tutorials</h2>
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
      <section>
        <h2>Deployment</h2>
        <div className={styles.deployment}>
          {deployment.map(({ icon, url }) => (
            <DocsLink href={url} key={url} className={styles.deploymentLogo}>
              {icon}
            </DocsLink>
          ))}
        </div>
      </section>
    </Main>
  );
}
