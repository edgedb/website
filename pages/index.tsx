import {PropsWithChildren, useEffect, useRef, useState} from "react";
import Link from "next/link";

import cn from "@/utils/classNames";

import MainLayout from "@/components/layouts/main";
import MetaTags from "@/components/metatags";

import styles from "@/styles/new_homepage.module.scss";

import {
  BackgroundBlock,
  BackgroundFader,
} from "@/components/homepage/backgroundFader";
import {Code, CopyCode} from "@/components/code";
import ArrowButton from "@/components/arrowButton";

import {
  awsLogo,
  azureLogo,
  digitalOceanLogo,
  dockerLogo,
  flyioLogo,
  googleCloudLogo,
} from "@/components/icons/cloudHosting";
import {
  DartLogo,
  DenoLogo,
  DotNetLogo,
  ElixirLogo,
  GoLogo,
  PythonLogo,
  RustLogo,
  TypescriptLogo,
} from "@/components/icons/clients";
import Migrations from "@/components/homepage/migrations";
import AnnotatedCodeBlock from "@/components/annotatedCodeBlock";

import WebGLWrapper, {WebGLModel} from "@/components/homepage/webgl";
import {ExampleRepl, ReplProvider} from "@/components/homepage/repl";
import SchemaViewer from "@/components/homepage/schema/schema";
import CodeExplainer from "@/components/codeExplainer";
import HeaderLink from "@/components/headerLink";
import LearnCards from "@/components/learnCards/learnCardsWithDesc";
import {homepageCards, URLS} from "../dataSources/data";

function InstallBlock() {
  const [selectedTab, setSelectedTab] = useState<"*nix" | "windows">("*nix");

  useEffect(() => {
    if (navigator.userAgent.includes("Windows")) {
      setSelectedTab("windows");
    }
  }, []);

  const [prompt, code] =
    selectedTab === "windows"
      ? ["PS>", `iwr https://ps1.edgedb.com -useb | iex`]
      : [
          "$",
          `curl --proto '=https' --tlsv1.2 -sSf https://sh.edgedb.com | sh`,
        ];

  return (
    <div className={styles.installBlock}>
      <div className={styles.installBlockTabs}>
        <div
          className={cn(styles.installTab, {
            [styles.selectedTab]: selectedTab === "*nix",
          })}
          style={{width: "175px"}}
          onClick={() => setSelectedTab("*nix")}
        >
          Linux and macOS
        </div>
        <div
          className={cn(styles.installTab, {
            [styles.selectedTab]: selectedTab === "windows",
          })}
          style={{width: "110px"}}
          onClick={() => setSelectedTab("windows")}
        >
          Windows
        </div>
      </div>

      <div className={styles.terminal}>
        <div className={styles.terminalInner}>
          <div className={styles.terminalPrompt}>{prompt}</div>
          <div className={styles.terminalCode}>{code}</div>
        </div>
        <CopyCode code={code} className={styles.terminalCopy} />
      </div>
    </div>
  );
}

function Tooltip({text, children}: PropsWithChildren<{text: string}>) {
  const [offset, setOffset] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className={styles.tooltipWrapper}
      onMouseEnter={(e) => {
        if (popupRef.current) {
          const targetRect = e.currentTarget.getBoundingClientRect();
          const parentRect = e.currentTarget.parentElement!.getBoundingClientRect();

          const leftEdge = targetRect.left - parentRect.left;
          const rightEdge = parentRect.right - targetRect.right;
          const overhang =
            (popupRef.current.clientWidth - e.currentTarget.clientWidth) / 2;
          let offset = 0;
          if (overhang > leftEdge) {
            offset = overhang - leftEdge;
          } else if (overhang > rightEdge) {
            offset = rightEdge - overhang;
          }
          setOffset(offset);
        }
      }}
    >
      {children}
      <div
        ref={popupRef}
        className={styles.tooltipPopup}
        style={{"--offset": offset + "px"} as any}
      >
        {text}
      </div>
    </div>
  );
}

const cloudHostLinks = [
  {name: "AWS", Logo: awsLogo, link: "/docs/guides/deployment/aws_aurora_ecs"},
  {
    name: "Google Cloud",
    Logo: googleCloudLogo,
    link: "/docs/guides/deployment/gcp",
  },
  {
    name: "Azure",
    Logo: azureLogo,
    link: "/docs/guides/deployment/azure_flexibleserver",
  },
  {
    name: "DigitalOcean",
    Logo: digitalOceanLogo,
    link: "/docs/guides/deployment/digitalocean",
  },
  {name: "Fly.io", Logo: flyioLogo, link: "/docs/guides/deployment/fly_io"},
  {name: "Docker", Logo: dockerLogo, link: "/docs/guides/deployment/docker"},
];

function FaqItem({title, children}: PropsWithChildren<{title: string}>) {
  const slug = title.toLowerCase().replace(/[^a-z]/g, "_");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (location.hash === `#${slug}`) {
      setOpen(true);
    }
  }, []);

  return (
    <details open={open}>
      <summary
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
      >
        <HeaderLink id={slug} element="div">
          {title}
        </HeaderLink>
      </summary>
      <div>{children}</div>
    </details>
  );
}

export default function Home() {
  return (
    <MainLayout
      className={cn(styles.page, styles.homepage)}
      footerClassName={styles.pageFooter}
      hideGlobalBanner={true}
      layout="absolute"
    >
      <MetaTags
        title="EdgeDB | The post-SQL era has arrived"
        siteTitle={null}
        description={`EdgeDB is an open-source database designed as a spiritual successor to SQL and the relational paradigm.`}
        relPath=""
        imagePath="/logos/edb_logo_white_twitter.png"
      />

      <WebGLWrapper>
        <BackgroundFader usePageBackground>
          <div className="globalPageWrapper">
            <div className={styles.content}>
              <BackgroundBlock colour="ffffff" particleColour="f1f1f1">
                <div className={styles.heroContainer}>
                  <h1>
                    The post-SQL era <br />
                    <span>has arrived</span>
                  </h1>
                  <WebGLModel
                    modelId="header"
                    className={styles.headerImage}
                  />
                </div>

                <div className={styles.intro}>
                  <p>
                    EdgeDB is an open-source database designed as a spiritual
                    successor to SQL and the relational paradigm. It aims to
                    solve some hard design problems that make existing
                    databases unnecessarily onerous to use.
                  </p>

                  <p>
                    Powered by the Postgres query engine under the hood, EdgeDB
                    thinks about schema the same way you do: as{" "}
                    <em>objects</em> with <em>properties</em> connected by{" "}
                    <em>links</em>. It's like a relational database with an
                    object-oriented data model, or a graph database with strict
                    schema. We call it a <em>graph-relational database</em>.
                  </p>

                  <p>Install EdgeDB locally with one command:</p>

                  <InstallBlock />
                </div>

                <div className={styles.cloudHostLogos}>
                  {cloudHostLinks.map(({name, Logo, link}, i) => (
                    <Tooltip
                      key={i}
                      text={`Click for step by step ${name} cloud hosting deploy instructions`}
                    >
                      <Link href={link}>
                        <a>
                          <Logo />
                        </a>
                      </Link>
                    </Tooltip>
                  ))}
                </div>
                <div className={styles.cloudHostLogosMessage}>
                  Tap a logo for step by step deploy instructions
                </div>
              </BackgroundBlock>
              <BackgroundBlock colour="f7f7f7" particleColour="ffffff">
                <h2>
                  A graph-like schema <br />
                  <span>with a relational core</span>
                </h2>

                <div
                  className={styles.sectionIntro}
                  style={{marginTop: "-40px"}}
                >
                  <p>
                    The core unit of schema in the{" "}
                    <a
                      href="/blog/the-graph-relational-database-defined"
                      style={{
                        textDecoration: "underline dotted",
                        color: "inherit",
                      }}
                    >
                      graph-relational model
                    </a>{" "}
                    is the object type—analogous to a table in SQL. Object
                    types contain properties and can be linked to other object
                    types to form a schema graph.
                  </p>
                </div>

                <SchemaViewer />

                <ArrowButton
                  href={URLS.DATA_MODELING}
                  subLabel="Learn more about"
                  label="Data modeling"
                />

                <h3 className={styles.subsectionHeader}>
                  schema that does more <br />
                  <span>so you don't have to</span>
                </h3>

                {/* <div className={styles.subsectionIntro}>
                  <p>
                    There’s more to EdgeDB schema than properties and links. We
                    have full feature parity with modern relational databases:
                    constraints, default values, indexes, computed properties,
                    type inheritance, deletion cascade policies, and more.
                  </p>
                </div> */}

                <AnnotatedCodeBlock
                  language="sdl"
                  code={[
                    `type Player {
  required property username -> str;
  property `,
                    {
                      id: "computed",
                      code: `clean_username := str_trim(.username)`,
                      title: "Computeds",
                      description: (
                        <div>
                          <p>
                            Object types can contain computed properties and
                            links. These "computeds" can return a modified
                            version of a single property, reference multiple
                            properties, or execute an entire subquery. The full
                            power of EdgeQL is at your disposal.
                          </p>
                          <p>
                            <a href="/docs/datamodel/computeds">View docs</a>
                          </p>
                        </div>
                      ),
                    },
                    `;
  required property level -> int64 {
    `,
                    {
                      id: "defaults",
                      code: `default`,
                      title: "Default values",
                      description: (
                        <>
                          <p>
                            The default expression will be executed upon
                            insertion. It can be an arbitrary EdgeQL
                            expression.
                          </p>
                          <p>
                            <a href="/docs/datamodel/properties#default-values">
                              View docs
                            </a>
                          </p>
                        </>
                      ),
                    },
                    ` := 0;
    `,
                    {
                      id: "constraints",
                      code: `constraint`,
                      title: "Constraints",
                      description: (
                        <>
                          <p>
                            Use a built-in constraint type or declare a custom
                            one that uses an arbitrary EdgeQL expression.
                            Properties, links, and object types can be
                            constrained.
                          </p>
                          <p>
                            <a href="/docs/datamodel/constraints">View docs</a>
                          </p>
                        </>
                      ),
                    },
                    ` min_value(0);
  }
  multi link friends -> Person {
    `,
                    {
                      id: "deletion_policy",
                      code: `on target delete`,
                      title: "Deletion policies",
                      description: (
                        <>
                          <p>
                            Links can be assigned a deletion policy, which
                            determines the cascade behavior when the target of
                            a link is deleted.
                          </p>
                          <p>
                            <a href="/docs/datamodel/links#deletion-policies">
                              View docs
                            </a>
                          </p>
                        </>
                      ),
                    },
                    ` allow;
  };
  `,
                    {
                      id: "indexes",
                      code: `index on`,
                      title: "Indexes",
                      description: (
                        <>
                          <p>
                            Speed matters. Create indexes on a single property
                            (computed or otherwise), combination of properties,
                            or arbitrary EdgeQL expression.
                          </p>
                          <p>
                            <a href="/docs/datamodel/indexes">View docs</a>
                          </p>
                        </>
                      ),
                    },
                    ` (.username);
}`,
                  ]}
                />

                <h3 className={styles.subsectionHeader}>
                  Putting the <span>great</span>
                  <br />
                  in <span>migrate</span>
                </h3>

                <div className={styles.subsectionIntro}>
                  <p>
                    All migrations are generated and tracked by the database.
                    You can interactively sanity-check each migration step with
                    the CLI-based migration workflow.
                  </p>
                </div>

                <Migrations />

                <ArrowButton
                  className={styles.migrationsButton}
                  href={URLS.MIGRATIONS}
                  subLabel="Learn more about"
                  label="Migrations"
                />
              </BackgroundBlock>
            </div>
          </div>
          <BackgroundFader className={styles.darkBlock} data-theme="dark">
            <div className="globalPageWrapper">
              <div className={`${styles.content} ${styles.edgeqlSection}`}>
                <BackgroundBlock colour="2c1428" particleColour="ffffff">
                  <h2 className={styles.edgeqlHeader}>
                    <div>
                      An <span>elegant query language</span> for a more{" "}
                      <span>civilized age</span>
                    </div>
                    <WebGLModel
                      modelId="edgeql"
                      className={styles.edgeqlText}
                    />
                  </h2>

                  <ReplProvider>
                    <div className={styles.edgeqlExamples}>
                      <div className={styles.exampleBlock}>
                        <div className={styles.exampleText}>
                          <div className={styles.numberedHeader}>
                            <h3>
                              Think in objects <br />
                              <span>not rows</span>
                            </h3>
                          </div>
                          <p>
                            EdgeQL solves the object-relational impedance
                            mismatch by returning a structured result object,
                            not a list of rows—eliminating the need for a
                            third-party ORM to denormalize the results.
                          </p>
                        </div>
                        <div className={styles.exampleRepl}>
                          <ExampleRepl queryIndex={0} />
                        </div>
                      </div>

                      {/* <div className={styles.exampleBlock}>
                        <div className={styles.exampleText}>
                          <div className={styles.numberedHeader}>
                            <h3>
                              <span>Deep fetching,</span> <br />
                              no joins required
                            </h3>
                          </div>
                          <p>
                            Declare your schema with the EdgeDB schema
                            language. Just write out your object types, their
                            properties, and the links between them. Foreign
                            keys aren’t required.
                          </p>
                        </div>
                        <div className={styles.exampleRepl}>
                          <ExampleRepl queryIndex={2} />
                        </div>
                      </div> */}

                      <div className={styles.exampleBlock}>
                        <div className={styles.exampleText}>
                          <div className={styles.numberedHeader}>
                            <h3>
                              A query language
                              <br />
                              <span>that composes</span>
                            </h3>
                          </div>
                          <p>
                            EdgeQL queries are fully composable, making things
                            like subqueries and nested inserts a breeze.
                          </p>
                        </div>
                        <div className={styles.exampleRepl}>
                          <ExampleRepl queryIndex={1} />
                        </div>
                      </div>

                      <div className={styles.exampleBlock}>
                        <div className={styles.exampleText}>
                          <div className={styles.numberedHeader}>
                            <h3>
                              Designed for devs
                              <br />
                              <span>not suits</span>
                            </h3>
                          </div>
                          <p>
                            SQL was designed with 1970s businessmen in mind,
                            and it shows. EdgeQL uses syntax that's familiar to
                            developers to represent selection sets, scope,
                            structure, and property assignment.
                          </p>
                        </div>
                        <div className={styles.exampleRepl}>
                          <ExampleRepl queryIndex={2} />
                        </div>
                      </div>
                    </div>
                  </ReplProvider>

                  <h3 style={{marginBottom: "40px", paddingTop: "100px"}}>
                    A comparison that <span>speaks for itself</span>
                  </h3>

                  <CodeExplainer
                    className={styles.sqlComparison}
                    defaultCodeLanguage="edgeql"
                    defaultExplanationLanguage="sql"
                    blocks={[
                      {
                        name: "Select",
                        code: `# EdgeQL

select Movie {
  title,
  actors: {
   name
  },
};`,
                        explanation: `# SQL

SELECT
  title,
  Actors.name AS actor_name
FROM Movie
 LEFT JOIN Movie_Actors ON
  Movie.id = Movie_Actors.movie_id
 LEFT JOIN Person AS Actors ON
  Movie_Actors.person_id = Person.id`,
                      },
                      {
                        name: "Aggregations",
                        code: `# EdgeQL

select Movie {
  title,
  actors: {
   name
  },
  rating := math::mean(.reviews.score)
};`,
                        explanation: `# SQL

SELECT
  title,
  Actors.name AS actor_name,
  (SELECT avg(score)
    FROM Movie_Reviews
    WHERE movie_id = Movie.id) AS rating
FROM
  Movie
  LEFT JOIN Movie_Actors ON
    Movie.id = Movie_Actors.movie_id
  LEFT JOIN Person AS Actors ON
    Movie_Actors.person_id = Person.id
`,
                      },
                      {
                        name: "Nested filters",
                        code: `# EdgeQL

select Movie {
  title,
  actors: {
   name
  },
  rating := math::mean(.reviews.score)
} filter "Zendaya" in .actors.name;`,
                        explanation: `# SQL

SELECT
  title,
  Actors.name AS actor_name,
  (SELECT avg(score)
    FROM Movie_Reviews
    WHERE movie_id = Movie.id) AS rating
FROM
  Movie
  LEFT JOIN Movie_Actors ON
    Movie.id = Movie_Actors.movie_id
  LEFT JOIN Person AS Actors ON
    Movie_Actors.person_id = Person.id
WHERE
  'Zendaya' IN (
    SELECT Person.name
    FROM
      Movie_Actors
      INNER JOIN Person
        ON Movie_Actors.person_id = Person.id
    WHERE
      Movie_Actors.movie_id = Movie.id)`,
                      },
                    ]}
                  />
                </BackgroundBlock>
                <BackgroundBlock colour="2e1e3e">
                  <h2 className={styles.todaysLanguagesHeader}>
                    Plays nice <br />
                    with <span>today's languages</span>
                  </h2>
                  {/* <div className={styles.sectionIntro}>
                    <p>
                      EdgeDB solves this problems once and for all. EdgeQL
                      queries return structured objects that are naturally
                      represented by your favorite language, eliminating the
                      need for ORMs (really).
                    </p>
                  </div> */}

                  <div className={`${styles.featureBlock}`}>
                    <div className={`${styles.featureBlockContent}`}>
                      <h3>
                        A Typescript query builder
                        <br />
                        <span>that puts ORMs to shame</span>
                      </h3>
                      <p>
                        It’s not an ORM; all the “object relational mapping”
                        happens inside EdgeDB. Instead, it’s a query builder
                        that’s auto-generated from your schema, can represent
                        arbitrarily complex EdgeQL queries, and statically
                        infers the type of the query result. Bye, bye, ORMs.
                      </p>
                    </div>
                    <div
                      className={cn(
                        styles.featureBlockExample,
                        styles.darkCodeBlock
                      )}
                    >
                      <Code
                        language="typescript"
                        noCopy={true}
                        showLineNumbers={true}
                        code={`import e, {createClient} from "./dbschema/edgeql-js";

const client = createClient();

const query = e.select(e.Movie, (movie) => ({
  title: true,
  actors: (actor) => ({
    name: true,
    uppercase_name: e.str_upper(actor.name),
    order_by: actor.name
  }),
  num_actors: e.count(movie.actors),
  filter: e.op(movie.title, 'ilike', '%avengers%')
}));

// fully typed results!
const result = await query.run(client);
result.actors[0].name;`}
                      />
                    </div>
                    <ArrowButton
                      href="/docs/clients/01_js/index"
                      className={styles.featureBlockLink}
                      subLabel="Discover"
                      label="Typescript query builder"
                    />
                  </div>

                  <h3
                    className={`${styles.subsectionHeader} ${styles.librariesHeader}`}
                  >
                    <span>First-party clients</span>
                    <br />
                    for your favorite languages
                  </h3>
                  {/* <div className={styles.subsectionIntro}>
                    <p>
                      We maintain first-party client libraries that implement
                      blazing-fast EdgeDB’s binary protocol, fault-tolerant
                      connection and query retries, and connection pooling.
                    </p>
                  </div> */}
                  <ul className={cn(styles.librariesList)}>
                    <li>
                      <h3>TypeScript and JavaScript</h3>
                      <div className={styles.logo}>
                        <TypescriptLogo />
                      </div>
                      <div className={styles.libUsage}>
                        <Code
                          language="bash"
                          code="$ npm install edgedb"
                          allowCopyOverlap
                        />
                      </div>
                      <div className={styles.linksList}>
                        <Link href="https://github.com/edgedb/edgedb-js">
                          <a>GitHub</a>
                        </Link>
                        <Link href="/docs/clients/js/index">
                          <a>Docs</a>
                        </Link>
                      </div>
                    </li>
                    <li>
                      <h3>Python</h3>
                      <div className={styles.logo}>
                        <PythonLogo />
                      </div>
                      <div className={styles.libUsage}>
                        <Code
                          language="bash"
                          code="$ pip install edgedb"
                          allowCopyOverlap
                        />
                      </div>
                      <div className={styles.linksList}>
                        <Link href="https://github.com/edgedb/edgedb-python">
                          <a>GitHub</a>
                        </Link>
                        <Link href="/docs/clients/python/index">
                          <a>Docs</a>
                        </Link>
                      </div>
                    </li>
                    <li>
                      <h3>Golang</h3>
                      <div className={styles.logo}>
                        <GoLogo />
                      </div>
                      <div className={styles.libUsage}>
                        <Code
                          language="bash"
                          code="$ go get github.com/edgedb/edgedb-go"
                          allowCopyOverlap
                        />
                      </div>
                      <div className={styles.linksList}>
                        <Link href="https://github.com/edgedb/edgedb-go">
                          <a>GitHub</a>
                        </Link>
                        <Link href="/docs/clients/go/index">
                          <a>Docs</a>
                        </Link>
                      </div>
                    </li>
                    <li>
                      <h3>Deno</h3>
                      <div className={cn(styles.logo, styles.deno)}>
                        <DenoLogo styles={styles} />
                      </div>
                      <div className={styles.libUsage}>
                        <Code
                          language="js"
                          code='import * as edgedb from "https://deno.land/x/edgedb/mod.ts";'
                          allowCopyOverlap
                        />
                      </div>
                      <div className={styles.linksList}>
                        <Link href="https://github.com/edgedb/edgedb-deno">
                          <a>GitHub</a>
                        </Link>
                      </div>
                    </li>
                    <li>
                      <h3>Rust</h3>
                      <div className={cn(styles.logo)}>
                        <RustLogo />
                      </div>
                      <div className={styles.libUsage}>
                        <Code
                          language="bash"
                          code="$ cargo install edgedb-tokio"
                          allowCopyOverlap
                        />
                      </div>
                      <div className={styles.linksList}>
                        <Link href="https://github.com/edgedb/edgedb-rust">
                          <a>GitHub</a>
                        </Link>
                        <Link href="https://docs.rs/edgedb-tokio">
                          <a>Docs</a>
                        </Link>
                      </div>
                    </li>
                    <li>
                      <h3>Dart</h3>
                      <div className={cn(styles.logo)}>
                        <DartLogo />
                      </div>
                      <div className={styles.libUsage}>
                        <Code
                          language="bash"
                          code="$ dart pub add edgedb"
                          allowCopyOverlap
                        />
                      </div>
                      <div className={styles.linksList}>
                        <Link href="https://github.com/edgedb/edgedb-dart">
                          <a>GitHub</a>
                        </Link>
                        <Link href="/docs/clients/dart/index">
                          <a>Docs</a>
                        </Link>
                      </div>
                    </li>
                    <li>
                      <h3>.NET</h3>
                      <div className={cn(styles.logo)}>
                        <DotNetLogo />
                      </div>
                      <div className={styles.libUsage}>
                        <Code
                          language="bash"
                          code="$ dotnet add package EdgeDB.Net.Driver"
                          allowCopyOverlap
                        />
                      </div>
                      <div className={styles.linksList}>
                        <Link href="https://github.com/quinchs/EdgeDB.Net">
                          <a>GitHub</a>
                        </Link>
                        <Link href="/docs/clients/dotnet/index">
                          <a>Docs</a>
                        </Link>
                      </div>
                    </li>
                    <li>
                      <h3>
                        Elixir
                        <span className={styles.langModifier}>unofficial</span>
                      </h3>
                      <div className={cn(styles.logo)}>
                        <ElixirLogo />
                      </div>
                      <div className={styles.libUsage}>
                        <Code
                          language="txt"
                          code={`add :edgedb to mix.exs`}
                          allowCopyOverlap
                        />
                      </div>
                      <div className={styles.linksList}>
                        <Link href="https://github.com/nsidnev/edgedb-elixir">
                          <a>GitHub</a>
                        </Link>
                        <Link href="https://hexdocs.pm/edgedb/main.html">
                          <a>Docs</a>
                        </Link>
                      </div>
                    </li>
                  </ul>
                </BackgroundBlock>
              </div>
            </div>
          </BackgroundFader>
          <div className="globalPageWrapper">
            <div className={styles.content}>
              <BackgroundBlock colour="f7f7f7" particleColour="ffffff">
                <h2 className={styles.workflowsHeader}>
                  Workflows
                  <br />
                  <span>that work</span>
                </h2>

                <div className={styles.featureBlock}>
                  <div className={styles.featureBlockContent}>
                    <h3>
                      <span>One CLI</span>
                      <br />
                      to rule them all
                    </h3>
                    <p>
                      Use our all-encompassing CLI to spin up new instances,
                      create and apply migrations, introspect schema, and
                      scaffold EdgeDB-backed applications. Install it with one
                      command.
                    </p>
                  </div>
                  <div
                    className={cn(
                      styles.featureBlockExample,
                      styles.lightCodeBlock
                    )}
                    data-theme="dark"
                  >
                    <Code
                      language="bash"
                      noCopy={true}
                      code={`$ curl --proto '=https' --tlsv1.2 -sSf https://sh.edgedb.com | sh
EdgeDB CLI installed.
$ edgedb project init
Do you want to initialize a new project? [Y/n]
> Y
$ edgedb
edgedb> select 2 + 2;`}
                    />
                  </div>
                  <ArrowButton
                    href="/docs/cli/index"
                    className={styles.featureBlockLink}
                    subLabel="Learn more about"
                    label="CLI"
                  />
                </div>

                <div className={styles.featureBlock}>
                  <div className={styles.featureBlockContent}>
                    <h3>
                      Host on your
                      <br />
                      <span>favorite cloud</span>
                    </h3>
                    <p>
                      While we develop a hosted version—more on that later—you
                      can host EdgeDB with your cloud of choice or self-host
                      with our official Docker image.
                    </p>
                  </div>
                  <div className={styles.featureBlockExample}>
                    <div className={styles.cloudHostsGrid}>
                      {cloudHostLinks.map(({Logo, link}, i) => (
                        <Link href={link} key={i}>
                          <a>
                            <Logo />
                          </a>
                        </Link>
                      ))}
                    </div>
                    <div className={styles.cloudHostsGridMessage}>
                      {typeof document === "undefined" ||
                      !("ontouchstart" in document.documentElement)
                        ? "Click"
                        : "Tap"}{" "}
                      a logo for a step-by-step guide.
                    </div>
                  </div>
                </div>

                <div className={styles.edbCloud}>
                  <WebGLModel modelId="cloud" className={styles.cloudModel} />

                  <div className={styles.comingSoon}>Coming Soon</div>
                  <h3>
                    EdgeDB <span>Cloud</span>
                  </h3>
                  <p>
                    We're building an EdgeDB hosting platform that’s
                    full-managed, auto-scaling, serverless-friendly, and
                    tightly integrated with our CLI. Drop your email to hear
                    when it's ready.
                  </p>
                  <div className={styles.cloudSubscribe}>
                    <a
                      href="/p/cloud-waitlist"
                      className={styles.cloudSubscribeLink}
                    >
                      <span>Join Cloud Waitlist</span>
                    </a>
                  </div>
                </div>
              </BackgroundBlock>
              <BackgroundBlock colour="ffffff" particleColour="f1f1f1">
                <h2 className={styles.underTheHoodHeader}>
                  Under <br />
                  <span>the hood</span>
                </h2>

                <div className={styles.underTheHood}>
                  {[
                    <>
                      <h4>Protocol</h4>
                      <p>
                        EdgeDB's binary protocol is designed to have minimal
                        latency possible, fast data marshalling, and to survive
                        network errors.
                      </p>
                    </>,

                    <>
                      <h4>Fully Open-source</h4>
                      <p>
                        EdgeDB is 100% Open Source and is distributed under
                        Apache 2.0 license, including the database core, the
                        client libraries, the CLI, and many other upcoming
                        libraries and services.
                      </p>
                      <a href="https://github.com/edgedb">
                        Check us out on GitHub!
                      </a>
                    </>,

                    <>
                      <h4>Optimizing Compiler</h4>
                      <p>
                        EdgeDB is analagous to "LLVM for data", in that it
                        compiles its high-level schema and queries to low-level
                        tables and optimized SQL. The result is great
                        performance without sacrificing usability or
                        functionality.
                      </p>
                    </>,

                    <>
                      <h4>Integration Platform</h4>
                      <p>
                        EdgeDB goes well beyond a typical feature set of a
                        database. Features that are traditionally pushed to
                        clients to deal with (HTTP API, GraphQL, observability)
                        are implemented right in the core.
                      </p>
                    </>,

                    <>
                      <h4>Built on PostgreSQL</h4>
                      <p>
                        EdgeDB uses PostgreSQL as its data storage and query
                        execution engine, benefitting from its exceptional
                        reliability.
                      </p>
                    </>,

                    <>
                      <h4>Asynchronous Core</h4>
                      <p>
                        EdgeDB server utilizes non-blocking IO to make client
                        connections cheap and scalable, solving the connection
                        overload problem that's increasingly prevalent in an
                        auto-scaling, serverless deployments. The underlying
                        PostgreSQL connection pool will be automatically scaled
                        as needed.
                      </p>
                    </>,

                    <>
                      <h4>Fast Queries</h4>
                      <p>
                        Convenience usually comes at the price of performance,
                        but not this time. EdgeQL is compiled into Postgres
                        queries that go head-to-head with the best handwritten
                        SQL.
                      </p>
                    </>,
                  ]
                    .reduce(
                      (cols, item, i) => {
                        cols[i % 2].push(
                          <div
                            key={i}
                            className={styles.numberedBlock}
                            style={{"--blockOrder": i + 1} as any}
                          >
                            {item}
                          </div>
                        );
                        return cols;
                      },
                      [[], []] as JSX.Element[][]
                    )
                    .map((col, i) => (
                      <div key={i} className={styles.blocksCol}>
                        {col}
                      </div>
                    ))}

                  <WebGLModel
                    modelId="underTheHood"
                    className={styles.underTheHoodModel}
                    fallbackClassName={styles.underTheHoodModelFallback}
                    stickyInner={true}
                  />
                </div>

                <h3 className={styles.subsectionHeader}>Benchmarks</h3>
                <div className={styles.subsectionIntro}>
                  <p>
                    Normally convenience comes at the price of performance, but
                    not this time. Under the hood, each EdgeQL query is
                    compiled into a single, optimized Postgres query that goes
                    to-head with the best handwritten SQL.
                  </p>
                </div>

                <div className={styles.benchmarksChart}>
                  <img src="/benchmarks.svg" alt="EdgeDB vs ORM benchmarks" />
                </div>

                <ArrowButton
                  href="https://www.edgedb.com/blog/why-orms-are-slow-and-getting-slower"
                  subLabel="Learn more about"
                  label="Benchmarks"
                />
              </BackgroundBlock>
              <BackgroundBlock colour="f7f7f7" particleColour="ffffff">
                <h2 style={{marginBottom: 0}}>Get started</h2>
                <h3>Install</h3>

                <div className={styles.getStartedInstall}>
                  <InstallBlock />
                </div>

                <LearnCards cards={homepageCards} />
              </BackgroundBlock>
              <BackgroundBlock colour="ffffff" particleColour="f1f1f1">
                <h2>FAQ</h2>

                <div className={styles.faq}>
                  <FaqItem title="Is EdgeDB a brand new database?">
                    <p>
                      EdgeDB is a new database with its own query language,
                      type system, and set of tools and conventions.
                    </p>
                    <p>
                      That said, EdgeDB is built on top of Postgres. This lets
                      us design a better abstraction for databases while taking
                      advantage of the incredible work done by the Postgres
                      community over the past 35 (!) years. Internally, all
                      EdgeQL queries are compiled into an equivalent Postgres
                      query. You can run EdgeDB as a query engine on top of an
                      externally hosted Postgres instance or let EdgeDB manage
                      Postgres for you under the hood.
                    </p>
                  </FaqItem>
                  <FaqItem title="Is EdgeDB an ORM?">
                    <p>
                      No. Like every database throughout history, EdgeDB
                      introduces a layer of abstraction on top of more
                      primitive mechanisms performing data access and
                      manipulation. In the case of most databases, these
                      mechanisms are often low-level key-value stores (for
                      example, WiredTiger in MongoDB, InnoDB in MySQL, or
                      RocksDB in CockroachDB). EdgeDB takes this concept one
                      level further: it treats PostgreSQL as a lower-level
                      storage engine and introduces better schema and query
                      abstractions on top.
                    </p>
                    <p>
                      In contrast, ORMs are libraries that provide a high-level
                      way to query and manipulate data in your database.
                      Typically an ORM :
                    </p>
                    <ol>
                      <li>
                        provides a standard interface for querying a number of
                        supported databases;
                      </li>
                      <li>
                        is strongly coupled to a particular programming
                        language;
                      </li>
                      <li>
                        is less capable than the query language it abstracts
                        away (usually SQL);
                      </li>
                      <li>
                        provides an object-oriented way to perform and persist
                        data manipulations
                      </li>
                    </ol>
                    <p>
                      EdgeDB has none of these properties. You query and
                      manipulate data with a full-featured query language
                      (EdgeQL) that is designed to match or surpass the power
                      of SQL (though certain advanced features are still under
                      development, see the Roadmap for details). It's language
                      agnostic: you can interact with your database with any
                      programming language you like. And it was designed from
                      the start as a new abstraction on top of Postgres
                      specifically.
                    </p>
                    <p>
                      That last part is important. It lets EdgeDB take full
                      advantage of the power of Postgres, whereas ORMs cannot;
                      their capabilities are limited to features shared by all
                      the databases they support.
                    </p>
                  </FaqItem>
                  <FaqItem title="What is a graph-relational database?">
                    <p>
                      The graph-relational model is a new conceptual model for
                      representing data. Under this model, data is represented
                      as strongly-typed objects that contain set-valued scalar
                      properties and links to other objects.
                    </p>
                    <p>
                      It takes the relational model and extends it in some key
                      ways.
                    </p>
                    <ol>
                      <li>
                        All objects have a globally unique <b>identity</b>. In
                        EdgeDB this is a <code>readonly uuid</code> property
                        called <code>id</code>.
                      </li>
                      <li>
                        Objects can be directly connected with <b>links</b>. No
                        foreign keys required.
                      </li>
                      <li>
                        Everything is a <b>set</b>. All values in EdgeDB are
                        strongly-typed sets with an associated type and a
                        cardinality constraint, eliminating SQL's distinction
                        between "table-valued" and "scalar-valued" expressions.
                      </li>
                    </ol>

                    <p>
                      For a more in-depth discussion of the graph-relational
                      model, refer to{" "}
                      <a href="/blog/the-graph-relational-database-defined">
                        this blog post
                      </a>
                      .
                    </p>
                  </FaqItem>
                  <FaqItem title="So what are the new features?">
                    <p>
                      There are a lot! Scroll down to the "Showcase" below for
                      a bunch of examples. As a rough structure, we consider
                      the main innovations to be three-fold:
                    </p>
                    <p>
                      <b>The EdgeQL query language:</b> a full redesign of SQL
                      that has been sorely needed for decades. This includes
                      support for GraphQL-style selection sets, easily nestable
                      subqueries (including inserts and updates), a new{" "}
                      <code>link</code> concept that abstracts away JOINs and
                      foreign keys, edge properties, and a typesafe NULL-free
                      type system grounded in set theory.
                    </p>
                    <p>
                      <b>Declarative schema.</b> The EdgeDB spec includes a
                      schema definition language (simply called the EdgeDB SDL)
                      that lets you define your schema declaratively and
                      succinctly, including advanced features like abstract
                      types, computed fields, unions, custom scalars, and JSON
                      support.
                    </p>
                    <p>
                      <b>First-party migrations.</b> Migrations have been a
                      pain point for developers since the introduction of SQL.
                      Hundreds of libraries across dozens of language
                      ecosystems have tried to solve the problem of SQL
                      migrations. EdgeDB ships with a first-party interactive
                      migration tool baked directly into the `edgedb`
                      command-line tool.
                    </p>
                    <p>
                      But there are a hundred cool and nifty ways we’ve
                      upgraded the developer experience of creating, querying,
                      and managing databases. Jump into{" "}
                      <Link href="/docs">
                        <a>the docs</a>
                      </Link>{" "}
                      to understand EdgeDB in all its glory.
                    </p>
                  </FaqItem>
                  <FaqItem title="How does it compare to other databases?">
                    <p>
                      EdgeDB is a relational database at its core. Literally:
                      it’s built on top of PostgreSQL. But it takes inspiration
                      of ideas pioneered by NoSQL, graph databases, GraphQL,
                      and ORM libraries.
                    </p>
                  </FaqItem>
                </div>
              </BackgroundBlock>
            </div>
          </div>
        </BackgroundFader>
      </WebGLWrapper>
    </MainLayout>
  );
}
