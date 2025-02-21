import React from "react";
import Link from "next/link";

import cn from "@edgedb-site/shared/utils/classNames";

import MainLayout from "@/components/layouts/main";

import CodeExplainer from "@/components/codeExplainer";

import styles from "@/styles/showcase.module.scss";
import MetaTags from "@/components/metatags";
import {Code} from "@edgedb-site/shared/components/code";
import LearnCards from "@/components/learnCards";
import {
  BackgroundBlock,
  BackgroundFader,
} from "@/components/homepage/backgroundFader";
import WebGLWrapper from "@/components/homepage/webgl";
import {learnCardsExtended, URLS} from "../../dataSources/data";

export default function GraphqlPage() {
  return (
    <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
      <MetaTags
        title="GraphQL Showcase"
        description={`EdgeDB supports GraphQL out-of-the-box. Any EdgeDB instance can process GraphQL queries and mutations via HTTP.`}
        relPath={URLS.GRAPHQL}
      />
      <WebGLWrapper>
        <BackgroundFader usePageBackground>
          <div className="globalPageWrapper">
            <div className={styles.content}>
              <BackgroundBlock colour="ffffff" particleColour="f1f1f1">
                <h1>GraphQL</h1>
                <div className={styles.intro}>
                  <p>
                    EdgeDB includes built-in support for GraphQL. Once you
                    activate the extension, your instance will expose a{" "}
                    <code>/graphql</code> endpoint that can process queries and
                    mutations via HTTP.
                  </p>

                  <p>
                    All queries on this page assume the following schema. If
                    you aren't familiar with how to model schemas in EdgeDB,
                    check out the{" "}
                    <Link href={URLS.DATA_MODELING}>
                      Data Modeling showcase
                    </Link>
                    .
                  </p>

                  <div
                    className={cn(
                      styles.exampleCode,
                      styles.codeContent,
                      styles.narrowSection
                    )}
                  >
                    <Code
                      code={`abstract type Person {
  required property name;
}

type Hero extending Person {
  secret_identity: str;
  number_of_movies: int64;
  multi friends: Hero; # many-to-many
}

type Villain extending Person {
  nemesis: Hero;
}`}
                      language={"sdl"}
                    />
                  </div>
                </div>
              </BackgroundBlock>
              <BackgroundBlock colour="f7f7f7" particleColour="ffffff">
                <section className={cn(styles.narrowSection)}>
                  <h3>Workflow</h3>
                  <p>
                    To activate the GraphQL extension on your instance, add the
                    following line somewhere in your schema file:
                  </p>
                  <div className={cn(styles.exampleCode, styles.code)}>
                    <Code
                      code={`using extension graphql;`}
                      language={"sdl"}
                      className={styles.codeExplainer}
                    />
                  </div>
                  <p>
                    Then create and apply a migration to activate the
                    extension.
                  </p>
                  <div className={cn(styles.exampleCode, styles.code)}>
                    <Code
                      className={styles.codeExplainer}
                      code={`$ edgedb migration create
Did you create extension 'graphql'? [y,n,l,c,b,s,q,?]
>y
Created ./dbschema/migrations/000XX.edgeql, id: m13mnixu...
$ edgedb migrate
Applied m13mnixu... (000XX.edgeql)`}
                      language={"bash"}
                    />
                  </div>
                  <p>
                    Your EdgeDB instance is now a fully operational GraphQL
                    server!
                  </p>
                  <ul>
                    <li>
                      <p>
                        Your schema can process GraphQL queries via HTTP at{" "}
                        <code>{`http://localhost:<port>/db/<database-name>/graphql`}</code>
                        . For full details on the GraphQL-over-HTTP protocol,
                        read the{" "}
                        <Link href="/docs/graphql/protocol">GraphQL docs</Link>
                        .
                      </p>
                    </li>
                    <li>
                      <p>
                        An interactive GraphiQL terminal is available at{" "}
                        <code>{`http://localhost:<port>/db/<database-name>/graphql/explore`}</code>
                        .
                      </p>
                    </li>
                  </ul>

                  <p>
                    To find your instance's port number, run{" "}
                    <code>edgedb server status</code>. The database name is
                    normally "edgedb" (the default database created in all
                    instances) but could be the name of another database you've
                    created in your instance.
                  </p>
                </section>
                <section className={styles.section}>
                  <h3>Querying</h3>
                  <p>
                    Every object type, abstract type, and{" "}
                    <Link href="/docs/datamodel/aliases">
                      expression alias
                    </Link>{" "}
                    is reflected as a query and three mutations: insert,
                    update, and delete mutations. Filter by any{" "}
                    <code>property</code> (including computed properties),
                    deeply fetch any <code>link</code>, and write advanced
                    queries with scalar-specific operators like{" "}
                    <code>like/ilike</code>, <code>gt/lt/gte/lte/nte</code>, or{" "}
                    <code>exists</code>. To compare these GraphQL queries
                    side-by-side with their EdgeQL equivalents, check out{" "}
                    <Link href="/vs/graphql">the comparison page</Link>.
                  </p>
                  <CodeExplainer
                    className={styles.codeExplainer}
                    blocks={[
                      {
                        name: "Simple query",
                        language: "graphql",
                        code: `query getHeroes {
  Hero {
    id
    name
    secret_identity
  }
}`,
                        explanation: `{
  "data": {
    "Hero": [
      {
        "id": "8a55cc24...",
        "name": "Iron Man",
        "secret_identity": "Tony Stark"
      },
      {
        "id": "82eefef6...",
        "name": "Spider-Man",
        "secret_identity": "Peter Parker"
      },
      ...
    ]
  }
}`,
                      },
                      {
                        name: "Nested query",
                        language: "graphql",
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
                        explanation: `{
  "data": {
    "Hero": [
      {
        "id": "8a55cc24...",
        "name": "Iron Man",
        "secret_identity": "Tony Stark",
        "villains": [
          {
            "id": "cd1872a6...",
            "name": "The Mandarin"
          },
          {
            "id": "d16e099c...",
            "name": "Whiplash"
          }
        ]
      },
      ...
    ]
  }
}`,
                      },
                      {
                        name: "Basic filter",
                        language: "graphql",
                        code: `query getHeroesFiltered {
  Hero(filter: { name: { eq: "Peter Parker" }}) {
    id
    name
    secret_identity
  }
}`,
                        explanation: `{
  "data": {
    "Hero": [
      {
        "id": "82eefef6...",
        "name": "Spider-Man",
        "secret_identity": "Peter Parker"
      }
    ]
  }
}`,
                      },
                      {
                        name: "Nested filters",
                        language: "graphql",
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
                        explanation: `{
  "data": {
    "Hero": [
      {
        "id": "82eefef6...",
        "name": "Peter Parker",
        "villains": [
          {
            "id": "b7102656...",
            "name": "The Vulture"
          },
          {
            "id": "bd5a3fe2...",
            "name": "The Green Goblin"
          }
        ]
      }
    ]
  }
}`,
                      },
                      {
                        name: "Advanced filtering",
                        language: "graphql",
                        code: `query getHeroesAdvancedFilter {
  Hero(filter: { or: [
    { secret_identity: { ilike: "%ark%" }},
    { villains: {name: { eq: "Loki" }}},
  ]}) {
    id
    name
  }
}`,
                        explanation: `{
  "data": {
    "Hero": [
      {
        "id": "8ea1f6d2...",
        "name": "Thor"
      },
      {
        "id": "8a55cc24...",
        "name": "Iron Man"
      },
      {
        "id": "82eefef6...",
        "name": "Spider-Man"
      }
    ]
  }
}`,
                      },
                      {
                        name: "Ordering",
                        language: "graphql",
                        code: `query getHeroesAlphabetical {
  Hero(order: { name: { dir: ASC }}){
    id
    name
  }
}`,
                        explanation: `{
  "data": {
    "Hero": [
      { "name": "Ant-Man" },
      { "name": "Black Widow" },
      { "name": "Captain America" },
      { "name": "Hawkeye" },
      { "name": "Hulk" },
      { "name": "Iron Man" },
      { "name": "Spider-Man" },
      { "name": "Thor" }
    ]
  }
}`,
                      },
                      {
                        name: "Pagination",
                        language: "graphql",
                        code: `query getHeroesSkipLimit {
  Hero(
    order: { name: { dir: ASC }},
    after: "2", # also: before
    first: 3 # also: last
  ){
    name
  }
}`,
                        explanation: `{
  "data": {
    "Hero": [
      { "name": "Hawkeye" },
      { "name": "Hulk" },
      { "name": "Iron Man" }
    ]
  }
}`,
                      },
                    ]}
                  />
                </section>
                <section className={styles.section}>
                  <h3>Mutation</h3>
                  <p>
                    Write advanced mutations containing scalar-specific
                    operators like <code>increment</code> and{" "}
                    <code>append</code>, create or update several objects in a
                    single query, and safely use GraphQL variables. To compare
                    these GraphQL queries side-by-side with their EdgeQL
                    equivalents, check out{" "}
                    <Link href="/vs/graphql">the comparison page</Link>.
                  </p>
                  <CodeExplainer
                    className={styles.codeExplainer}
                    blocks={[
                      {
                        name: "Insert",
                        language: "graphql",
                        code: `mutation {
  insert_Hero(data: {
    name: "The Falcon",
    secret_identity: "Sam Wilson"
  }) {
    id name secret_identity
  }
}`,
                        explanation: `{
  "data": {
    "insert_Hero": [
      {
        "id": "ed1ad7ca...",
        "name": "The Falcon",
        "secret_identity": "Sam Wilson"
      }
    ]
  }
}`,
                      },
                      {
                        name: "Update",
                        language: "graphql",
                        code: `mutation updateHero {
  update_Hero(
    filter: { secret_identity: { eq: "Sam Wilson" }},
    data: {
      # also: append, prepend, slice
      name: { set: "Captain America" },
      # also: clear, increment, decrement
      number_of_movies: { set: 1 }
    }
  ) {
      id name secret_identity number_of_movies
  }
}`,
                        explanation: `{
  "data": {
    "update_Hero": [
      {
        "id": "ed1ad7ca...",
        "name": "Captain America",
        "secret_identity": "Sam Wilson",
        "number_of_movies": 1
      }
    ]
  }
}`,
                      },
                      {
                        name: "Delete",
                        language: "graphql",
                        code: `mutation deleteIrrelevantHero {
  delete_Hero(
    filter: { name: { eq: "Hawkeye" }}
  ) {
    id, name
  }
}`,
                        explanation: `{
  "data": {
    "delete_Hero": [
      {
        "id": "0ddf6fd4...",
        "name": "Hawkeye"
      }
    ]
  }
}`,
                      },
                      {
                        name: "Insert multiple",
                        language: "graphql",
                        code: `mutation insertVillains {
  insert_Villain(data: [
    { name: "Ronan the Accuser" },
    { name: "Red Skull" },
    { name: "The Vulture" },
  ]) { id name }
}`,
                        explanation: `{
  "data": {
    "insert_Villain": [
      {
        "id": "039ce4c4...",
        "name": "Ronan the Accuser"
      },
      {
        "id": "039ceae6...",
        "name": "Red Skull"
      },
      {
        "id": "039ceb72...",
        "name": "The Vulture"
      }
    ]
  }
`,
                      },
                      {
                        name: "Nested insert",
                        language: "graphql",
                        code: `mutation insertNestedVillain {
  insert_Villain(data: {
    name: "Kingpin",
    nemesis: {
      data: {
        name: "Daredevil",
        secret_identity: "Matt Murdock"
      }
    }
  }) { id name nemesis { id name }}
}
`,
                        explanation: `{
  "data": {
    "insert_Villain": [
      {
        "id": "c276aa2a...",
        "name": "Kingpin",
        "nemesis": {
          "id": "c276a8f4...",
          "name": "Daredevil"
        }
      }
    ]
  }
}`,
                      },
                      {
                        name: "Nested connect",
                        language: "graphql",
                        code: `mutation insertVillainConnect {
  insert_Villain(data: {
    name: "Green Goblin",
    nemesis: {
      filter: {
        name: { eq: "Spider-Man" }
      }
    }
  }) { id name nemesis { id name }}
}`,
                        explanation: `{
  "data": {
    "insert_Villain": [
      {
        "id": "a1b682f4...",
        "name": "Green Goblin",
        "nemesis": {
          "id": "82eefef6...",
          "name": "Spider-Man"
        }
      }
    ]
  }
}`,
                      },
                      {
                        name: "Disconnect",
                        language: "graphql",
                        code: `mutation insertVillainDisconnect {
  update_Villain(
    filter: { name: { eq: "Green Goblin" }},
    data: { nemesis: { clear: true }}
  ) {id name nemesis {id}}
}
`,
                        explanation: `{
  "data": {
    "update_Villain": [
      {
        "id": "a1b682f4...",
        "name": "Green Goblin",
        "nemesis": null
      }
    ]
  }
}`,
                      },
                      {
                        name: "Variables",
                        language: "graphql",
                        code: `mutation insertVillain($name: String!) {
  insert_Villain(data: { name: $name }) {
    id,
    name
  }
}

# variables:
{ "name": "Thanos" }
`,
                        explanation: `{
  "data": {
    "insert_Villain": [
      {
        "id": "6afad2ca...",
        "name": "Thanos"
      }
    ]
  }
}`,
                      },
                    ]}
                  />
                </section>
              </BackgroundBlock>
              <BackgroundBlock colour="ffffff" particleColour="f1f1f1">
                <section className={styles.section}>
                  <h2>Keep exploring</h2>
                  <LearnCards
                    cards={learnCardsExtended.filter(
                      (card) => card.href !== URLS.GRAPHQL
                    )}
                  />
                </section>
              </BackgroundBlock>
            </div>
          </div>
        </BackgroundFader>
      </WebGLWrapper>
    </MainLayout>
  );
}
