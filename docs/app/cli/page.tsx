import Link from "next/link";
import { Code } from "@edgedb-site/shared/components/code";
import { Main } from "@/components/layout";
import styles from "../docs.module.scss";

export default function CliPage() {
  return (
    <Main className={styles.indexPage}>
      <h1>CLI</h1>
      {/* <div className={styles.cliIntroImg} /> */}
      <p>
        The EdgeDB command-line interface (CLI) provides an idiomatic interface
        for installing EdgeDB, spinning up local instances, opening a REPL,
        executing queries, interacting with EdgeDB Cloud, creating migrations,
        and more.
      </p>
      <section>
        <h2>Installation</h2>
        <p>
          First let's install the EdgeDB CLI. Open a terminal and run the
          appropriate command below.
        </p>
        <h3>Linux/macOS</h3>
        <Code
          language="bash"
          code={`$ curl https://sh.edgedb.com --proto '=https' -sSf1 | sh`}
          className={styles.code}
        />
        <h3>Windows (Powershell)</h3>
        <div className={styles.note}>
          <p>
            {" "}
            EdgeDB on Windows requires WSL 2 because the EdgeDB server runs on
            Linux.
          </p>
        </div>
        <Code
          language="powershell"
          code={`PS> iwr https://ps1.edgedb.com -useb | iex`}
          className={styles.code}
        />
        <div className={styles.note}>
          <p>
            Check out our additional installation methods for{" "}
            <Link href="https://www.edgedb.com/install#linux-debianubuntults">
              various Linux distros
            </Link>
            , via{" "}
            <Link href="https://www.edgedb.com/install#macos-homebrew">
              Homebrew
            </Link>{" "}
            on macOS, and for the{" "}
            <Link href="https://www.edgedb.com/install#windows-commandprompt">
              Windows Command Prompt.
            </Link>
          </p>
        </div>
        <h3>Nightly</h3>
        <p>
          Use this command to install the latest nightly build of the CLI (not
          to be confused with the nightly build of EdgeDB itself):
        </p>
        <Code
          language="bash"
          code={`$ curl https://sh.edgedb.com --proto '=https' -sSf1 | sh`}
          className={styles.code}
        />
      </section>
      <section>
        <h2>Usage</h2>
        <p>
          Using the CLI is as simple as typing the appropriate command. Explore
          this section of the documentation for information on what each
          available command and option does. For a more convenient way to
          discover the CLI, try adding --help to any CLI command or sub-command
          for a brief description of its function, sub-commands, and options
          right in your command line!
        </p>
      </section>
    </Main>
  );
}
