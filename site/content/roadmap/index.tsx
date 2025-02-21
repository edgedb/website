import NextLink from "next/link";

import {Section} from "./interfaces";

const Link = ({href, children}: React.PropsWithChildren<{href: string}>) => (
  <NextLink href={href}>{children}</NextLink>
);

export const sections: Section[] = [
  {
    title: "Data Model",
    intro: (
      <>
        <p>EdgeDB foundation: modern, type-safe, relational data model.</p>
        <p>
          EdgeDB is built on top of PostgreSQL, inheriting all its core
          strengths: ACID compliance, performance, and reliability.
        </p>
      </>
    ),
    groups: [
      {
        items: [
          {
            title: "Type System",
            badge: "done",
            content: (
              <p>
                <Link href="/docs/datamodel/index">Object types</Link>, scalar
                types, arrays, tuples. Type composition and inheritance.
              </p>
            ),
          },
          {
            title: "Functions and Operators",
            badge: "done",
            content: (
              <p>
                Support for polymorphic and generic functions and operators.
                Support for{" "}
                <Link href="/docs/reference/sdl/functions">
                  user-defined functions
                </Link>
                .
              </p>
            ),
          },
          {
            title: "Constraints",
            badge: "done",
            content: (
              <p>
                Support for arbitrary expressions in{" "}
                <Link href="/docs/datamodel/constraints">constraints</Link>.
                Multi-property constraints.
              </p>
            ),
          },
          {
            title: "Introspection",
            badge: "done",
            content: (
              <p>
                Complete schema{" "}
                <Link href="/docs/guides/introspection/index">
                  introspection
                </Link>{" "}
                via EdgeQL and GraphQL queries.
              </p>
            ),
          },
          {
            title: "Triggers",
            badge: "post-1.0",
            content: (
              <p>
                Ability to declare insert/update/delete triggers on object
                types.
              </p>
            ),
          },
        ],
        codeblocks: [
          [
            {
              language: "sdl",
              code: `
                abstract type Shape;

                type Rectangle extending Shape {
                  property width -> float64;
                  property height -> float64;
                }

                type Circle extending Shape {
                  property radius -> float64;
                }


                function area(shape: Rectangle)
                  -> float64
                from edgeql $$
                  SELECT shape.width * shape.height
                $$;

                function area(shape: Circle)
                  -> float64
                from edgeql $$
                  SELECT 3.1415 * shape.radius ^ 2
                $$;`,
            },
            {
              language: "edgeql",
              code: `
                # A polymorphic EdgeQL query:
                SELECT
                  Shape {
                    typename := .__type__.name,
                    area := area(Shape)
                  }
                FILTER
                  Shape IS (Circle | Rectangle);`,
            },
          ],
        ],
      },
    ],
  },
  {
    title: "EdgeQL",
    intro: (
      <p>
        EdgeQL is the primary language of EdgeDB. It is used to define, mutate,
        and query data. Its main goals are to be{" "}
        <Link href="/blog/we-can-do-better-than-sql">readable</Link>, concise,
        and yet as powerful as SQL.
      </p>
    ),
    groups: [
      {
        items: [
          {
            title: "Object Hierarchies",
            badge: "done",
            content: (
              <p>
                EdgeQL allows to fetch deep object{" "}
                <Link href="/docs/edgeql/expressions/shapes">hierarchies</Link>{" "}
                effortlessly, while applying filtering and sorting to the
                nested data.
              </p>
            ),
          },
          {
            title: "Aggregate Functions",
            badge: "done",
            content: (
              <p>
                <Link href="/docs/stdlib/set">Aggregate functions</Link>{" "}
                perform calculation on sets. EdgeDB supports many statistical
                and compositional aggregates.
              </p>
            ),
          },
          {
            title: "Recursive Insert",
            badge: "done",
            content: (
              <p>
                Support for{" "}
                <Link href="/docs/edgeql/insert#nested-inserts">
                  inserting
                </Link>{" "}
                a hierarchy of objects in a single atomic statement.
              </p>
            ),
          },
          {
            title: "Type Safety",
            badge: "done",
            content: <p>EdgeQL is a strongly typed functional language.</p>,
          },
        ],
        codeblocks: [
          {
            language: "edgeql",
            code: `
              SELECT
                Movie {
                  title,

                  actors: {
                    name,
                    email
                  } ORDER BY .name,

                  avg_review := math::mean(
                    .reviews.rating)
                }
              FILTER
                datetime_get(.release_date,
                            'year')
                IN {2018, 2019};


              INSERT
              Movie {
                title := 'Dune',
                actors := {
                  (INSERT Person {
                    name := 'Jason Momoa',
                  }),
                  (INSERT Person {
                    name := 'Rebecca Ferguson',
                  })
                }
              };`,
          },
        ],
      },
      {
        items: [
          {
            title: "Error Diagnostics",
            badge: "partly",
            content: (
              <p>
                Errors should always be descriptive and besides just saying
                that something went wrong, they should suggest where exactly
                and how to fix that.
              </p>
            ),
          },
        ],
        codeblocks: [
          {
            language: "edgeql-repl",
            code: `
              edgedb> SELECT Movie {
              .......   avg_review := math::mean(.reviews.rating),
              ....... } FILTER .release_date > <datetime>'2018-01-01';

              InvalidValueError: invalid input to mean(): not enough elements in input set
              ### SELECT Movie {
              ###   avg_review := math::mean(.reviews.rating),
              ###                 ^^^^^^^^^^ help: consider guarding with an IF expression
              ### } FILTER .release_date > <datetime>'2018-01-01';`,
          },
        ],
        alignment: "below",
      },
      {
        items: [
          {
            title: "Analytical Queries",
            badge: "planned-1.x",
            content: <p>Generalized partitioning and window functions.</p>,
          },
        ],
        codeblocks: [
          {
            language: "edgeql",
            code: `
              WITH
                Win AS WINDOW (WeeklyShowing
                              GROUP BY .movie
                              ORDER BY .week)

              SELECT
                WeeklyShowing {
                  movie,
                  week,
                  box_office,
                  weekly_change :=
                    (lag(.box_office) OVER Win) -
                    .box_office
                }

              FILTER
                .movie.name ILIKE 'Avengers%';`,
          },
          {
            language: "edgeql",
            code: `
              GROUP
                Movie {
                  release_year := datetime_get(
                    .release_date, 'year')
                }

              BY
                Movie.genre, Movie.release_year

              INTO
                MG

              UNION
              (
                genre := MG.genre,

                release_year := MG.release_year,

                avg_viewer_rating := math::mean(
                  MG.reviews.rating),

                max_box_office := max(
                  MG.box_office)
              );`,
          },
        ],
        alignment: "below",
      },
      {
        items: [
          {
            title: "Basic IDE Support",
            badge: "done",
            content: (
              <p>
                Official language highlighting packages for{" "}
                <a href="https://atom.io/packages/edgedb">Atom</a>,{" "}
                <a href="https://packagecontrol.io/packages/EdgeDB">
                  Sublime Text
                </a>
                ,{" "}
                <a href="https://marketplace.visualstudio.com/itemdetails?itemName=magicstack.edgedb">
                  Visual Studio Code
                </a>
                , and <a href="https://github.com/edgedb/edgedb-vim">Vim</a>.
              </p>
            ),
          },
          {
            title: "Language Server Protocol",
            badge: "post-1.0",
            content: (
              <p>
                Integrated LSP support allows code-completion and error
                highlighting for EdgeQL and EdgeDB SDL in IDEs.
              </p>
            ),
          },
          {
            title: "Updatable Views",
            badge: "post-1.0",
            content: (
              <p>
                Updatable views are an important mechanism for Database Views,
                GraphQL mutations and backwards-compatible schema migrations.
              </p>
            ),
          },
        ],
        codeblocks: [
          {
            language: "edgeql",
            code: `
              CREATE VIEW Comedy := (
                SELECT Movie {
                  name,
                }
                FILTER
                  .genre = 'Comedy'
              );


              INSERT
                Comedy {
                  name := 'Long Shot',
                  genre := 'Comedy'
                };`,
          },
        ],
      },
      {
        items: [
          {
            title: "EdgePL",
            badge: "post-1.0",
            content: (
              <p>
                EdgePL is the imperative language used to write more complex
                functions and triggers.
              </p>
            ),
          },
        ],
        codeblocks: [
          {
            language: "edgeql",
            code: `
              CREATE FUNCTION fibonacci(n: int64) -> int64 FROM EdgePL $$

                let z := 0;
                let i := 0;
                let j := 1;

                if n < 1 {
                  return 0;
                }

                while z <= n {
                  z := z + 1;
                  i, j := j, i + j;
                }

                return i;

              $$;`,
          },
        ],
        alignment: "below",
      },
    ],
  },
  {
    title: "GraphQL",
    intro: <p>EdgeDB ships with built-in GraphQL support.</p>,
    groups: [
      {
        items: [
          {
            title: "Querying Object Types",
            badge: "done",
            content: (
              <p>
                Any EdgeDB object type can be queried and introspected via{" "}
                <Link href="/docs/graphql/index">GraphQL</Link>.
              </p>
            ),
          },
          {
            title: "Querying Expression Aliases",
            badge: "done",
            content: (
              <p>
                GraphQL can query EdgeQL{" "}
                <Link href="/docs/datamodel/aliases">Aliases</Link> in
                situations where a complex condition or a function call is
                needed.
              </p>
            ),
          },
          {
            title: "Access Control",
            badge: "planned-1.x",
            content: (
              <p>
                Access control and business logic rules specified at the schema
                level and transparently enforced for GraphQL queries.
              </p>
            ),
          },
          {
            title: "Mutations",
            badge: "done",
            content: (
              <p>
                Support for mutation of object types and EdgeQL updatable
                views.
              </p>
            ),
          },
          {
            title: "Subscriptions",
            badge: "post-1.0",
            content: (
              <p>
                Support for subscribing to a GraphQL endpoint to receive live
                updates.
              </p>
            ),
          },
        ],
        codeblocks: [
          {
            language: "graphql",
            code: `
              fragment Groups on User {
                groups {
                  name
                }
              }

              query {
                User(filter: {
                  name: {ilike: "anna%"},
                  age: {gt: 30}
                }) {
                  name
                  age

                  settings(
                    order: {name: {dir: ASC}},
                    first: 5
                  ) {
                    name
                    value
                  }

                  ...Groups
                }
              }`,
          },
        ],
      },
    ],
  },
  {
    title: "Standard Library",
    intro: (
      <p>
        The goal of the EdgeDB standard library is to include a large set of
        high-quality, consistent functions and operators.
      </p>
    ),
    groups: [
      {
        items: [
          {
            title: "Numerics",
            badge: "done",
            content: (
              <p>
                Common{" "}
                <Link href="/docs/stdlib/numbers">numeric functions</Link>,
                operators and literals. Strict handling of numeric precision.
              </p>
            ),
          },
          {
            title: "Strings",
            badge: "done",
            content: (
              <p>
                Common <Link href="/docs/stdlib/string">string functions</Link>{" "}
                and operators. Raw strings literals, regular expressions.
              </p>
            ),
          },
          {
            title: "Date and Time",
            badge: "done",
            content: (
              <p>
                Strict, consistent handling of timezone-aware{" "}
                <Link href="/docs/stdlib/datetime">datetimes</Link>, local
                date, local time and durations.
              </p>
            ),
          },
          {
            title: "JSON",
            badge: "done",
            content: (
              <p>
                <Link href="/docs/stdlib/json">Functions</Link>, operators and
                casts to traverse, extract and form JSON values.
              </p>
            ),
          },
          {
            title: "GIS Extensions",
            badge: "post-1.0",
            content: (
              <p>
                Geometry and geography types and associated functions and
                operators.
              </p>
            ),
          },
          {
            title: "Vectors and Matrices",
            badge: "post-1.0",
            content: (
              <p>
                Support for efficient numeric vector and matrix computations.
              </p>
            ),
          },
        ],
        codeblocks: [
          {
            language: "edgeql-repl",
            code: `
              db> SELECT (5 / 2, 5 // 2);
              {2.5, 2}

              db> SELECT 1.5n + 1.0;
              QueryError: operator '+' cannot be
              applied to operands of type
              'std::decimal' and 'std::float64'

              db> SELECT <local_date>'2019-01-01';
              {'2019-01-01'}

              db> SELECT <datetime>'2019-01-01';
              InvalidValueError: missing required
              timezone specification

              db> SELECT <datetime>'2019-01-01 EST';
              {'2019-01-01T05:00:00+00:00'}

              db> SELECT <json>Movie {
              ...   title,
              ...   year,
              ... }
              {'{"title": "Blade Runner", "year": 1982}',
              '{"title": "Dune", "year": 2020}'}`,
          },
        ],
      },
    ],
  },
  {
    title: "SDL and Migrations",
    groups: [
      {
        items: [
          {
            title: "Core Support",
            badge: "done",
            content: (
              <p>
                Support for{" "}
                <Link href="/docs/reference/sdl/index">
                  declarative schema definition
                </Link>{" "}
                (SDL) and automatic DDL generation as migrations.
              </p>
            ),
          },
          {
            title: "Rollback Support",
            badge: "planned-1.x",
            content: <p>Support for migration rollbacks.</p>,
          },
        ],
        codeblocks: [
          {
            language: "edgeql",
            code: `
              START MIGRATION TO {
                module default {
                  # type Review { ... }
                  # type Person { ... }

                  type Movie {
                    required property title -> str;
                    required property year -> int64;

                    multi link reviews -> Review;
                    multi link directors -> Person;
                    multi link cast -> Person;

                    property avg_rating :=
                      math::mean(.reviews.rating);
                  }
                }
              };

              POPULATE MIGRATION;

              COMMIT MIGRATION;`,
          },
        ],
      },
      {
        items: [
          {
            title: "Tooling and Workflow Integration",
            badge: "inprogress",
            content: (
              <p>
                <code>edgedb migration</code> command line utility for
                interactive migration generation and integration with version
                control systems.
              </p>
            ),
          },
        ],
        codeblocks: [
          {
            language: "bash",
            code: `
              $ ls -l dbschema/
              default.esdl

              $ edgedb migration create
              Migration 0001-initial created.

              $ ls -l dbschema/migrations/
              0001-initial.edgeql

              $ edgedb migrate
              Applying migrations:
                - 0001-initial      [OK]

              $ sed -i 's/type Order/type Invoice/g' dbschema/default.esdl

              $ edgedb migration create
              Detected schema changes:

                ALTER TYPE Order RENAME TO Invoice;

              Confirm migration chunk [y,n,a,d,e,?] y
              Migration 0002-order-rename created.

              $ edgedb migrate
              Applying migrations:
                - 0002-order-rename [OK]`,
          },
        ],
        alignment: "below",
      },
      {
        items: [
          {
            title: "Multiple Schema Versions and Live Migrations",
            badge: "post-1.0",
            content: (
              <p>
                Staggered update deployment and continuous integration require
                both the old and the newschema to be available at the same
                time. On large deployments there should be a way to migrate
                without blocking production traffic.
              </p>
            ),
          },
        ],
        codeblocks: [
          {
            language: "bash",
            code: `
              prod-02 $ env EDGEDB_SCHEMA_TAG=v99 run_server.py

              ### Meanwhile, on a devbox: ###
              devbox $ edgedb migration create --tagged
              Migration 0100-schema-updates created.

              devbox $ deploy_to_prod.sh --to prod-01
              prod-01) Applying migrations:
              prod-01)   - 0100-schema-updates [OK]
              prod-01) Restarting server:
              prod-01)   env EDGEDB_SCHEMA_TAG=v100 run_server.py`,
          },
        ],
        alignment: "below",
      },
    ],
  },
  {
    title: "Access Control",
    groups: [
      {
        items: [
          {
            title: "Fine-grained Data Access Control Rules",
            badge: "planned-1.x",
            content: (
              <p>
                Data access control is one of the most ubiquitous types of
                business logic in applications. Supporting flexible access
                rules at the schema level benefits performance, security, and
                development productivity through the separation of concerns.
              </p>
            ),
          },
        ],
        codeblocks: [
          {
            language: "sdl",
            code: `
              type Service {
                property name -> str
              };

              type ServiceProvider extending User;

              type ServiceManager extending User {
                link service -> Service;
              };

              type Order {
                link service -> Service;
                link provider -> ServiceProvider;
                property total -> decimal;

                policy sp_access on SELECT {
                WHEN
                  (GLOBAL user) IS ServiceProvider
                CHECK
                  .provider = (GLOBAL user)
                };

                policy sm_access on SELECT {
                WHEN
                  (GLOBAL user) IS ServiceManager
                CHECK
                  .service = (GLOBAL user).service
                }
              }`,
          },
          {
            language: "edgeql-repl",
            code: `
              db> SET GLOBAL user := (
              ...  SELECT ServiceProvider
              ...  FILTER .name = 'Roofing inc.'
              ... );
              SET GLOBAL

              db> SELECT count(Order);
              {10}

              db> SET GLOBAL user := (
              ...  SELECT ServiceManager
              ...  FILTER .name = 'Roof Manager'
              ... );
              SET GLOBAL

              db> SELECT count(Order);
              {123}`,
          },
        ],
        alignment: "below",
      },
      {
        items: [
          {
            title: "Database Views",
            badge: "post-1.0",
            content: (
              <>
                <p>
                  Schema introspection has powerful applications in automatic
                  or assisted generation of APIs, user interfaces and
                  application bindings. However, there are security and API
                  surface exposure concerns when it comes to exposing the
                  database schema. Database views can help with that.
                </p>

                <p>
                  Combined with fine-grained data access control rules, this
                  can significantly reduce the need to write backend code.
                </p>
              </>
            ),
          },
        ],
        codeblocks: [
          {
            language: "edgeql",
            code: `
              database view GraphQLView {
                # Export all types from the
                # "users" module:
                type users::*;

                # Export the "Order" type as
                # "Invoice" with a limited
                # set of properties:
                type orders::Order as Invoice {
                  link user;

                  property subtotal;
                  property taxes;

                  property total :=
                    .subtotal + .taxes;
                }
              };

              # Start a GraphQL endpoint
              # exposing the "GraphQLView"
              # view:
              CONFIGURE SYSTEM INSERT Port {
                protocol := "graphql+http",
                database := "GraphQLView",
                port := 80,
                user := "graphql",
              };`,
          },
        ],
        alignment: "left",
      },
    ],
  },
  {
    title: "Caching",
    groups: [
      {
        items: [
          {
            title: "Stored Computeds",
            badge: "post-1.0",
            content: (
              <>
                <p>
                  Stored computed properties and links with flexible
                  invalidation policy:
                </p>
                <ul>
                  <li>valid forever (computed exactly once);</li>
                  <li>valid for a period of time;</li>
                  <li>invalidated automatically when source data changes.</li>
                </ul>
              </>
            ),
          },
        ],
        codeblocks: [
          {
            language: "sdl",
            code: `
              type Movie {
                link reviews -> Review;
                property avg_rating {
                  expr := math::mean(.reviews.rating);
                  stored := true;
                  valid_for := <duration>'1 hour'
                }
              }`,
          },
        ],
        alignment: "left",
      },
    ],
  },
  {
    title: "Client Language Bindings",
    intro: (
      <>
        <p>
          EdgeDB will provide native idiomatic drivers for all popular
          platforms. Drivers for Go, Rust, Ruby, Java, and .NET are on our
          list.
        </p>
        <p>
          In any EdgeDB client library data can be requested either as
          high-level objects or JSON.
        </p>
      </>
    ),
    groups: [
      {
        items: [
          {
            title: "Python",
            badge: "done",
            content: (
              <p>
                A fast{" "}
                <Link href="/docs/clients/00_python/index">Python driver</Link>{" "}
                supporting both blocking IO and async/await paradigms.
              </p>
            ),
          },
          {
            title: "JavaScript / TypeScript",
            badge: "done",
            content: (
              <p>
                An idiomatic{" "}
                <Link href="/docs/clients/01_js/index">JavaScript driver</Link>{" "}
                with support for both async/await and callback APIs.
              </p>
            ),
          },
          {
            title: "HTTP",
            badge: "done",
            content: (
              <p>
                EdgeDB can expose both EdgeQL and GraphQL via an HTTP endpoint.
              </p>
            ),
          },
        ],
        codeblocks: [
          {
            language: "python",
            code: `
              # Use "query()" to fetch data
              # as rich Python objects.
              #
              # (If JSON is needed, just use
              # the "query_json()" method - no
              # need to change the query).
              movies = await conn.fetchall('''
                SELECT
                  Movie {
                    title,

                    actors: {
                      name,
                      email
                    } ORDER BY .name,

                    avg_review := math::mean(
                      .reviews.rating)
                  }
                FILTER
                  datetime_get(.release_date,
                              'year')
                  IN {2018, 2019};
              ''')

              print(movies)`,
          },
        ],
      },
      {
        items: [
          {
            title: "Query Builders and Schema Reflection",
            badge: "planned-1.x",
            content: (
              <p>
                EdgeDB bindings for all languages will have a query building
                API.
              </p>
            ),
          },
        ],
        codeblocks: [
          {
            language: "python",
            code: `
              from edgedb import qb, connect
              from my.app import esdl as schema


              get_movies_query = qb.shape(schema.Movie, [
                'title',

                qb.shape(schema.Movie.actors, [
                  'name',
                  'email'
                ]).order_by('.name'),

                qb.computed('avg_review', qb.math.mean(
                  schema.Movie.reviews.rating))
              ]).filter(
                qb.IN(
                  qb.datetime_get(schema.Movie.release_date, 'year'),
                  {2018, 2018}
                )
              )


              conn = connect()
              data = conn.query_json(get_movies_query)
              print(data)`,
          },
        ],
        alignment: "below",
      },
    ],
  },
];
