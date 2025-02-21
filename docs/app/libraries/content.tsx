import {
  DartIcon,
  ElixirIcon,
  GoIcon,
  GraphQLIcon,
  HttpIcon,
  JavaIcon,
  DotnetIcon,
  PythonIcon,
  RustIcon,
  TsJsIcon,
} from "@/components/icons";
import { DocsLink } from "@/dataSources/validateLink";
import styles from "../docs.module.scss";

export const languages = [
  {
    icon: <TsJsIcon className={styles.tsJs} />,
    url: "/libraries/js",
  },
  {
    icon: <PythonIcon />,
    url: "/libraries/python",
  },
  {
    icon: <GoIcon className={styles.iconPath} />,
    url: "/libraries/go",
  },
  {
    icon: <RustIcon className={styles.iconPath} />,
    url: "/libraries/rust",
  },
  {
    icon: <DartIcon />,
    url: "/libraries/dart",
  },
  {
    icon: <DotnetIcon className={styles.dotnet} />,
    url: "/libraries/dotnet",
  },
  {
    icon: <JavaIcon />,
    url: "/libraries/java",
  },
  {
    icon: <ElixirIcon />,
    url: "/libraries/elixir",
  },
  {
    icon: <HttpIcon />,
    url: "/libraries/http",
  },
  {
    icon: <GraphQLIcon />,
    url: "/libraries/graphql",
  },
];

export const designFeatures = [
  {
    title: "Automatic client pooling",
    content: (
      <>
        Most libraries implement a Client class that internally manages an
        internal client-side connection pool that works transparently and gets
        out of the way, while enabling you to write scalable code.
      </>
    ),
  },
  {
    title: "Zero config",
    content: (
      <>
        All client libraries implement a standard protocol for determining how
        to connect to your database. In most cases, this will involve checking
        for special environment variables like <code>EDGEDB_DSN</code> or, in
        the case of EdgeDB Cloud instances, <code>EDGEDB_INSTANCE</code> and{" "}
        <code>EDGEDB_SECRET_KEY</code>. (More on this in the Connection section
        below.)
      </>
    ),
  },
  {
    title: "Query execution",
    content: (
      <>
        A Client will provide both blocking and non-blocking methods for
        executing queries against your database so that you can use the IO mode
        that works best in every scenario. Under the hood, your query is
        executed using EdgeDB’s efficient binary protocol.
      </>
    ),
  },
  {
    title: "Resiliency",
    content: (
      <>
        EdgeDB client libraries automatically retry failed transactions and
        queries so that your users get greater reliability without any extra
        effort from you.
      </>
    ),
  },
  {
    title: "Code generation",
    content: (
      <>
        EdgeDB client libraries automatically retry failed transactions and
        queries so that your users get greater reliability without any extra
        effort from you.
      </>
    ),
  },
  {
    title: "Consistency",
    content: (
      <>
        EdgeDB client libraries are all designed with the same philosophy. This
        means, once you learn one of them, you basically know them all.
        They&rsquo;re all implemented in a consistent way while also taking into
        account the idioms of the language. No matter which binding,
        you&rsquo;ll feel right at home!
      </>
    ),
  },
];

export const connectingOptions = [
  {
    title: "For local instances",
    content: (
      <>
        Use{" "}
        <DocsLink href="/cli/edgedb_project/edgedb_project_init">
          <code>edgedb project init</code>
        </DocsLink>{" "}
        in your project&rsquo;s directory to initialize that directory as an
        EdgeDB project. This will allow you to either create a new instance
        associated with this directory or to associate an existing instance. All
        commands run from this directory that don’t specify connection options
        will automatically connect to this instance. The same goes for any
        client libraries running within the directory.
      </>
    ),
  },
  {
    title: "For EdgeDB Cloud instances",
    content: (
      <>
        Set the <code>EDGEDB_INSTANCE</code> and <code>EDGEDB_SECRET_KEY</code>{" "}
        environment variables. The client will use these to connect to your
        EdgeDB Cloud instance.
      </>
    ),
  },
  {
    title: "For self-hosted instances",
    content: (
      <>
        Set the <code>EDGEDB_DSN</code> environment variables to a DSN that
        points to your instance. The client will use it to connect to your
        EdgeDB instance.
      </>
    ),
  },
  {
    title: "As an alternative in local development…",
    content: (
      <>
        you may pass a DSN or instance name to the client creation function.
        Here&rsquo;s what it looks like in JavaScript:
      </>
    ),
  },
];
