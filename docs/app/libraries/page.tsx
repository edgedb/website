import Link from "next/link";
import { Code } from "@edgedb-site/shared/components/code";
import { Main } from "@/components/layout";
import { DocsLink } from "@/dataSources/validateLink";
import { connectingOptions, designFeatures, languages } from "./content";
import styles from "../docs.module.scss";

export default function ClientLibsPage() {
  return (
    <Main className={styles.indexPage}>
      <h1>Libraries</h1>
      <p>
        EdgeDB implements libraries for popular languages which make it easier
        to build applications backed by EdgeDB.
      </p>
      <section>
        <h2>Languages</h2>
        <div className={styles.clientsLanguages}>
          {languages.map(({ icon, url }) => (
            <DocsLink href={url} key={url} className={styles.logoWrapper}>
              {icon}
            </DocsLink>
          ))}
        </div>
      </section>
      <section className={styles.sectionClientsDesign}>
        <h2>Design</h2>
        <p>
          Our libraries provide a common set of functionality and a consistent
          design philosophy.
        </p>
        <div>
          <div>
            {designFeatures.slice(0, 3).map(({ title, content }) => (
              <div key={title}>
                <h3>{title}</h3>
                <p>{content}</p>
              </div>
            ))}
          </div>
          <div>
            {designFeatures.slice(3).map(({ title, content }) => (
              <div key={title}>
                <h3>{title}</h3>
                <p>{content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section>
        <h2>Connecting</h2>
        {connectingOptions.map(({ title, content }) => (
          <div key={title}>
            <h3>{title}</h3>
            <p>{content}</p>
          </div>
        ))}
        <Code
          language="typescript"
          code={`const client = edgedb.createClient({
  dsn: "edgedb://..."
});`}
          className={styles.code}
        />
        <p>
          See{" "}
          <DocsLink href="/libraries/connection">
            connection parameters
          </DocsLink>{" "}
          for more options for connecting a client to your EdgeDB instance.
        </p>
      </section>
    </Main>
  );
}
