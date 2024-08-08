import Link from "next/link";
import { Code } from "@edgedb-site/shared/components/code";
import { Main } from "@/components/layout";
import { DocsLink } from "@/dataSources/validateLink";

import styles from "../docs.module.scss";
import { cloudCommands } from "./content";
import { connectingYourApp } from "../cloud/content";

export default function CloudPage() {
  return (
    <Main className={styles.indexPage}>
      <h1>EdgeDB Cloud</h1>
      <p>
        EdgeDB Cloud is a fully managed, effortless cloud database service,
        engineered to let you deploy your database instantly and connect from
        anywhere with near-zero configuration.
      </p>
      <section>
        <h2>Connecting your app</h2>
        <p>
          Try a guide for connecting your app running on your platform of
          choice:
        </p>
        <div className={styles.tutorials}>
          {connectingYourApp.map(({ icon, url }) => (
            <DocsLink href={url} key={url} className={styles.tutorialLogo}>
              {icon}
            </DocsLink>
          ))}
        </div>
        <p>
          To connect your apps running on other platforms, generate a dedicated
          secret key for your instance with{" "}
          <code>edgedb cloud secretkey create</code> or via the web UI's “Secret
          Keys” pane in your instance dashboard. Create two environment
          variables accessible to your production application:
        </p>
        <ul className={styles.deploymentList}>
          <li>
            <code>EDGEDB_SECRET_KEY</code> - contains the secret key you
            generated
          </li>
          <li>
            <code>EDGEDB_INSTANCE</code> - the name of your EdgeDB Cloud
            instance (<code>{`<org-name>/<instance-name>`}</code>)
          </li>
        </ul>
        <div className={styles["youtube-embed"]}>
          <iframe
            title="EdgeDB cloud"
            src={`https://www.youtube.com/embed/r--YN_6a76g`}
            allowFullScreen
            loading="lazy"
          />
        </div>
      </section>
      <section className={styles.sectionCloudCode}>
        <h2>Two ways to use EdgeDB Cloud</h2>
        <h3>1. CLI</h3>
        <p>Log in to EdgeDB Cloud via the CLI:</p>
        <Code
          language="bash"
          code={`$ edgedb cloud login`}
          className={styles.code}
        />
        <p>
          This will open a browser window and allow you to log in via GitHub.
          Now, create your EdgeDB Cloud instance the same way you would create a
          local instance:
        </p>
        <Code
          language="bash"
          code={`$ edgedb instance create <org-name>/<instance-name>`}
          className={styles.code}
        />
        <p>or</p>
        <Code
          language="bash"
          code={`$ edgedb project init \\
  --server-instance <org-name>/<instance-name>`}
          className={styles.code}
        />
        <h3>2. GUI</h3>
        <p>
          Create your instance at{" "}
          <Link href="https://cloud.edgedb.com">cloud.edgedb.com</Link> by
          clicking on “Create new instance” in the “Instances” tab.
        </p>
        <div className={styles.cloudGuiImg} />
        <p>
          Complete the following form to configure your instance. You can access
          your instance via the CLI using the name{" "}
          <code>{`<org-name>/<instance-name>`}</code> or via the GUI.
        </p>
      </section>
      <section>
        <h2>Useful EdgeDB Cloud commands</h2>
        <div className={styles.cloudCommands}>
          <div>
            {cloudCommands.slice(0, 3).map(({ title, code }) => (
              <div key={title}>
                <h3>{title}</h3>
                <Code language="bash" code={code} className={styles.code} />
              </div>
            ))}
          </div>
          <div>
            {cloudCommands.slice(3).map(({ title, code }) => (
              <div key={title}>
                <h3>{title}</h3>
                <Code language="bash" code={code} className={styles.code} />
              </div>
            ))}
            <div className={styles.note}>
              <p>Restoring works only to an empty database.</p>
            </div>
          </div>
        </div>
      </section>
      <section>
        <h2>Questions? Problems? Bugs?</h2>
        <ul>
          <li>
            Please join us on{" "}
            <Link href="https://www.edgedb.com/p/discord">our Discord</Link> to
            ask questions.
          </li>
          <li>
            If you're experiencing a service interruption, check{" "}
            <Link href="https://www.edgedbstatus.com/">our status page</Link>{" "}
            for information on what may be causing it.
          </li>
          <li>
            Report any bugs you find by{" "}
            <Link href="https://edgedb.com/p/cloud-support">
              submitting a support ticket
            </Link>
            . Note: when using EdgeDB Cloud through the CLI, setting the
            RUST_LOG environment variable to info, debug, or trace may provide
            additional debugging information which will be useful to include
            with your ticket.
          </li>
        </ul>
      </section>
    </Main>
  );
}
