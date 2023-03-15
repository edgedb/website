import React from "react";
import Link from "next/link";

import cn from "@/utils/classNames";

import MainLayout from "@/components/layouts/main";

import CodeExplainer from "@/components/codeExplainer";

import styles from "@/styles/showcase.module.scss";
import MetaTags from "@/components/metatags";
import {Code} from "@/components/code";
import LearnCards from "@/components/learnCards";
import {learnCards, learnCardsExtended, URLS} from "dataSources/data";

export default function Home() {
  return (
    <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
      <MetaTags
        title="GraphQL vs EdgeDB"
        description={`EdgeDB and GraphQL solve some of the same problems. We compare their modeling and querying languages side-by-side.`}
        relPath="/vs/graphql"
      />
      <div className="globalPageWrapper">
        <div className={styles.content}>
          <h1>GraphQL vs EdgeDB</h1>
          <div className={styles.contentBlock}>
            <p>
              Despite being fundamentally different technologies, EdgeDB and
              GraphQL solve some of the same problems. GraphQL is a
              specification for implementing typesafe APIs, consisting of a
              data modeling language, a query language, and a set of associated
              tools. EdgeDB is a database, coupled with an associated data
              modeling language, a query language (EdgeQL), and set of
              associated tools.
            </p>
            <p>
              Indeed GraphQL was a source of inspiration for the design of
              EdgeDB, specifically:
            </p>
            <ul>
              <li>
                its succinct, declarative, object-oriented modeling language{" "}
              </li>
              <li>its composable, syntax-rich query language </li>
              <li>
                its intuitive approach to field selection and deep fetching
              </li>
            </ul>
            <p>
              So below we compare GraphQL and EdgeDB side-by-side. If you're
              familiar with GraphQL, this should be an effective way to map
              syntax and concepts you're already familiar with from GraphQL
              onto EdgeDB. Moreover, the examples below will highlight
              scenarios where GraphQL falls short relative to a fully-fledged
              query language like EdgeQL.
            </p>
          </div>

          <div className={styles.sectionSpacer} />
          <div className={styles.featureBlock}>
            <h2>Modeling</h2>
            <div className={styles.contentBlock}>
              <p>
                Both EdgeDB and GraphQL provide a schema definition language
                (SDL) for defining your schema. In the case of GraphQL it's
                your API schema; in the case of EdgeDB it's your application's
                data model. Let's see how these two SDLs stack up side-by-side.
              </p>
            </div>
            <div className={cn(styles.featureBlockContent, styles.vertical)}>
              <CodeExplainer
                defaultCodeLanguage={"graphql"}
                defaultExplanationLanguage={"sdl"}
                blocks={[
                  {
                    name: "Scalar types",

                    explanation: `str
bool
int{16|32|64}
float{32|64}
uuid
bigint
decimal
sequence
datetime
duration
cal::local_datetime
cal::local_date
cal::local_time
json
`,
                    code: `# No native support for
# temporal or JSON fields

String
Boolean
Int
Float
ID`,
                  },
                  {
                    name: "Object types",
                    explanation: `type User {
  required property first_name -> str;
  property middle_name -> str;
}
`,
                    code: `type User {
  first_name: String!
  middle_name: String
}`,
                  },
                  {
                    name: "Abstract types",

                    explanation: `abstract type HasName {
  required property first_name -> str;
  required property last_name -> str;
}

abstract type HasEmail {
  required property email -> str;
}

# multiple inheritance
type User extending HasName, HasEmail {
  required property password_hash -> str;
}`,
                    code: `interface HasName {
  first_name String!
  last_name String!
}

interface HasEmail {
  email String!
}

# non-abstract type must contain all fields
# of implemented interfaces
type User implements HasName & HasEmail {
  first_name String!
  last_name String!
  email String!
  password_hash String!
}`,
                  },
                  {
                    name: "Relations",

                    explanation: `type BlogPost {
  required property content -> str;
  required link author -> User;
}

type User {
  required property email -> str;
  multi link blogPosts := .<author[IS BlogPost];
}`,
                    code: `type BlogPost {
  content String!
  author User
}

type User {
  email String!
  blogPosts [BlogPost!]!
}`,
                  },
                  {
                    name: "Polymorphic types",

                    explanation: `abstract type Person {
  required property name -> str;
}

type Hero extending Person {
  property secret_identity -> str;
}

type Villain extending Person {}

type Movie {
  multi link characters -> Person;
}`,
                    code: `interface Person {
  name String!
}

type Hero implements Person {
  name String!
  secret_identity String
}

type Villain implements Person {
  name String!
}

type Movie {
  characters [Person!]!
}`,
                  },
                  {
                    name: "Unions",

                    explanation: `type File {
  required property contents -> str;
}

type Folder {
  required property name -> str;
  multi link children -> Folder | File;
}`,
                    code: `union FolderOrFile = File | Folder;

type File {
  contents String!
}

type Folder {
  name String!
  children [FolderOrFile!]!;
}`,
                  },

                  {
                    name: "Enums and Arrays",

                    explanation: `scalar type LifeStatus extending
  enum<Living, Deceased, Zombie>;

type User {
  property status -> LifeStatus;
  required property favorite_colors -> array<str>;
}`,
                    code: `enum LifeStatus {
  LIVING
  DECEASED
  ZOMBIE
}

type User {
  status LifeStatus;
  favorite_colors [String!]!
}`,
                  },
                  //                   {
                  //                     name: "Tuples",
                  //
                  //                     explanation: `type User {
                  //   # unnamed tuple
                  //   property bingo -> <str, number>;

                  //   # named tuple
                  //   property favorite_player -> tuple<name:str,jersey_number:float64,active:bool>;
                  // }`,
                  //                     code: `# Not supported in GraphQL`,
                  //                   },
                  {
                    name: "Custom scalars",

                    explanation: `scalar type username extending str {
  constraint min_len_value(8);
  constraint max_len_value(30);
};`,
                    code: `# GraphQL allows custom scalar definitions
# but the behavior of those scalars
# is implementation-dependent

scalar Username`,
                  },
                ]}
              />
            </div>
            <div className={styles.contentBlock}>
              <p>
                By virtue of being a database instead of an API definition
                language, EdgeDB's SDL is far broader in scope than GraphQL, to
                include concepts like constraints, default values, computed
                properties/links, indexes, stored procedures, link properties,
                and much more. Check out the{" "}
                <Link href={URLS.DATA_MODELING}>Data Modeling showcase</Link>{" "}
                for a more complete picture of EdgeDB's data modeling
                capabilities.
              </p>
            </div>
          </div>
          <div className={styles.sectionSpacer} />
          <div className={styles.contentBlock}>
            <h2>Query language</h2>
            <p>
              GraphQL and EdgeDB both feature an associated query language. To
              facilitate side-by-side comparison, we'll be considering a
              hypothetical GraphQL API that supports querying and mutation of
              your entire database.
            </p>
            <p>
              In fact, this isn't just a hypothetical; EdgeDB instances can
              process EdgeQL queries! With the flip of a switch, you can query
              and mutate data in EdgeDB via GraphQL. For details, check out the
              GraphQL <Link href={URLS.GRAPHQL}>showcase page</Link> and{" "}
              <Link href="/docs/graphql/index">documentation</Link>.
            </p>
            <p>
              All queries in the following sections assume the following
              schema:
            </p>

            <div className={cn(styles.exampleCode, styles.code)}>
              <Code
                code={`abstract type Person {
  required property name -> str {
    constraint exclusive;
  };
}

type Villain extending Person {
  link nemesis -> Hero;
}

type Hero extending Person {
  property secret_identity -> str;
  property number_of_movies -> int64;
  multi link villains := .<nemesis[IS Villain];
}`}
                language={"sdl"}
              />
            </div>
          </div>
          <div className={styles.sectionSpacer} />
          <div className={styles.featureBlock}>
            <h2>Querying</h2>
            <div className={cn(styles.featureBlockContent, styles.vertical)}>
              <CodeExplainer
                defaultCodeLanguage="graphql"
                defaultExplanationLanguage="sdl"
                blocks={[
                  {
                    name: "Simple query",

                    code: `query getHeroes {
  Hero {
    id
    name
    secret_identity
  }
}`,
                    explanation: `SELECT Hero {
  id,
  name,
  secret_identity
}`,
                  },
                  {
                    name: "Nested query",

                    code: `query getHeroes {
  Hero {
    id
    name
    secret_identity
    villains {
      id
      name
    }
  }
}`,
                    explanation: `SELECT Hero {
  id,
  name,
  secret_identity,
  villains: {
    id,
    name
  }
}`,
                  },
                  {
                    name: "Basic filter",

                    code: `query getHeroesFiltered {
  Hero(filter: { name: { eq: "Peter Parker" }}) {
    id
    name
    secret_identity
  }
}`,
                    explanation: `SELECT Hero {
  id,
  name,
  secret_identity
}
FILTER .name = 'Spider-Man';`,
                  },
                  {
                    name: "Nested filters",

                    code: `query getHeroesNestedFilter {
  Hero(filter: { name: { eq: "Peter Parker" }}) {
    id
    name
    villains(filter: { name: { ilike: "The %" }}) {
      id
      name
    }
  }
}`,
                    explanation: `SELECT Hero {
  id,
  name,
  villains: {
    id,
    name
  } FILTER .name ILIKE 'The %'
}
FILTER .name = 'Spider-Man';`,
                  },
                  {
                    name: "Advanced filtering",

                    code: `query getHeroesAdvancedFilter {
  Hero(filter: { or: [
    { secret_identity: { ilike: "%ark%" }},
    { villains: {name: { eq: "Loki" }}},
  ]}) {
    id
    name
  }
}`,
                    explanation: `SELECT Hero {
  id,
  name
} FILTER
  .secret_identity ILIKE '%ark%' OR
  .villains.name = 'Loki';`,
                  },
                  {
                    name: "Pagination",

                    code: `query getHeroesAlphabetical {
  Hero(
    order: { name: { dir: DESC }},
    after: "3"
    first: 3
  ){
    id
    name
  }
}`,
                    explanation: `SELECT Hero {
  id
  name
}
ORDER BY .name DESC
OFFSET 4
LIMIT 3

`,
                  },
                  {
                    name: "Polymorphic query",

                    code: `# this syntax is not currently supported
# by EdgeDB's internal GraphQL server

query {
  Movie {
    id
    characters {
      name
      ... on Hero {
        secret_identity
      }
      ... on Villain {
        nemesis { id name }
      }
    }
  }
}`,
                    explanation: `SELECT Movie {
  id,
  characters: {
    name,
    [IS Hero].secret_identity,
    [IS Villain].nemesis: { id,  name }
  }
}`,
                  },
                  {
                    name: "Variables",

                    code: `mutation insertVillain($name: String!) {
  insert_Villain(data: { name: $name }) {
    id
  }
}

# variables:
{ "name": "Thanos" }
`,
                    explanation: `INSERT Villain {
  name := $name
}

# variables:
{ "name": "Thanos" }`,
                  },
                ]}
              />
            </div>
          </div>
          <div className={styles.sectionSpacer} />
          <div className={styles.featureBlock}>
            <h2>Mutation</h2>

            <div className={cn(styles.featureBlockContent, styles.vertical)}>
              <CodeExplainer
                defaultCodeLanguage="graphql"
                defaultExplanationLanguage="sdl"
                blocks={[
                  {
                    name: "Insert",

                    code: `mutation {
  insert_Hero(data: {
    name: "The Falcon",
    secret_identity: "Sam Wilson"
  }) { id }
}`,
                    explanation: `INSERT Hero {
  name := 'The Falcon',
  secret_identity := 'Sam Wilson'
};`,
                  },
                  {
                    name: "Update",

                    code: `mutation updateHero {
  update_Hero(
    filter: { secret_identity: { eq: "Sam Wilson" }},
    data: {
      # also: append, prepend, slice
      name: { set: "Captain America" },
      # also: clear, increment, decrement
      number_of_movies: { set: 1 }
    }
  ) { id }
}`,
                    explanation: `UPDATE Hero
FILTER .secret_identity = 'Sam Wilson'
SET {
  name := 'Captain America',
  number_of_movies := 1
};`,
                  },
                  {
                    name: "Delete",

                    code: `mutation deleteIrrelevantHero {
  delete_Hero(
    filter: { name: { eq: "Hawkeye" }}
  ) { id }
}`,
                    explanation: `DELETE Hero
FILTER .name = 'Hawkeye';`,
                  },
                  {
                    name: "Insert multiple",

                    code: `mutation insertVillains {
  insert_Villain(data: [
    { name: "Ronan the Accuser" },
    { name: "Red Skull" },
    { name: "The Vulture" },
  ]) { id name }
}`,
                    explanation: `SELECT {
    (INSERT Villain { name := "Ronan the Accuser" }),
    (INSERT Villain { name := "Red Skull" }),
    (INSERT Villain { name := "The Vulture" }),
} {
    id,
    name
};`,
                  },
                  {
                    name: "Nested insert",

                    code: `mutation insertNestedVillain {
  insert_Villain(data: {
    name: "Kingpin",
    nemesis: {
      data: {
        name: "Daredevil",
        secret_identity: "Matt Murdock"
      }
    }
  }) { id }
}
`,
                    explanation: `INSERT Villain {
  name := 'Kingpin',
  nemesis := (INSERT Hero {
    name := 'Daredevil',
    secret_identity := 'Matt Murdock'
  })
}`,
                  },
                  {
                    name: "Nested connect",

                    code: `mutation insertVillainConnect {
  insert_Villain(data: {
    name: "Green Goblin",
    nemesis: {
      filter: {
        name: { eq: "Spider-Man" }
      }
    }
  }) { id }
}`,
                    explanation: `INSERT Villain {
  name := 'Green Goblin',
  nemesis := (
    SELECT HERO .name = "Spider-Man"
  )
}`,
                  },
                  {
                    name: "Disconnect",

                    code: `mutation insertVillainDisconnect {
  update_Villain(
    filter: { name: { eq: "Green Goblin" }},
    data: { nemesis: { clear: true }}
  ) { id }
}
`,
                    explanation: `UPDATE Villain
FILTER .name = 'Green Goblin'
SET {
  nemesis := {} # empty set
}`,
                  },
                  {
                    name: "Mutation + fetch",

                    code: `mutation insertNestedVillain {
  insert_Villain(data: {
    name: "Kingpin",
    nemesis: {
      data: {
        name: "Daredevil",
        secret_identity: "Matt Murdock"
      }
    }
  }) {
    id
    name
    nemesis { id name }
  }
}
`,
                    explanation: `SELECT (
  INSERT Villain {
    name := 'Kingpin',
    nemesis := (INSERT Hero {
      name := 'Daredevil',
      secret_identity := 'Matt Murdock'
    })
  }
) {
  id,
  name,
  nemesis: { id, name }
};`,
                  },
                ]}
              />
            </div>
          </div>
          <div className={styles.contentBlock}>
            <p>
              The examples above draw comparisons between GraphQL and EdgeDB
              where possible. However, due to the fundamentally different
              nature of the technologies, there is a wide swath of EdgeDB
              features that are out of scope for an API specification language
              like GraphQL: computed properties, subqueries, with clauses, type
              casting, and a large set of built-in operators and utility
              functions. For a more comprehensive overview of EdgeDB features
              and syntax check out the{" "}
              <Link href={URLS.EDGEQL}>EdgeQL showcase</Link>.
            </p>
          </div>
          <div className={styles.sectionSpacer} />
          <div className={styles.featureBlock}>
            <h2>Learn EdgeDB</h2>
            <LearnCards
              cards={learnCardsExtended.filter(
                (card) => card.href !== URLS.GRAPHQL
              )}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
