import React from "react";

import cn from "@/utils/classNames";

import MainLayout from "@/components/layouts/main";

import CodeExplainer from "@/components/codeExplainer";

import styles from "@/styles/showcase.module.scss";
import MetaTags from "@/components/metatags";
import {Code} from "@/components/code";
import LearnCards from "@/components/learnCards";
import WebGLWrapper from "@/components/homepage/webgl";
import {
  BackgroundBlock,
  BackgroundFader,
} from "@/components/homepage/backgroundFader";
import {learnCardsExtended, URLS} from "../../dataSources/data";

export default function EdgeqlPage() {
  return (
    <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
      <MetaTags
        title="EdgeQL"
        description={`EdgeQL is a next-generation query language designed
to match SQL in power and surpass it in terms of clarity, brevity, and
intuitiveness.`}
        relPath={URLS.EDGEQL}
      />
      <WebGLWrapper>
        <BackgroundFader usePageBackground>
          <div className="globalPageWrapper">
            <div className={styles.content}>
              <BackgroundBlock colour="ffffff" particleColour="f1f1f1">
                <h1>EdgeQL</h1>
                <div className={styles.intro}>
                  <p>
                    EdgeQL is a spiritual successor to SQL designed with a few
                    core principles in mind.
                  </p>
                </div>
                <div className={styles.edgeqlIntro}>
                  <div>
                    <div className={styles.edgeqlIntroSection}>
                      <h6>Compatible with modern languages.</h6>
                      <p>
                        A jaw-dropping amount of effort has been spent
                        attempting to bridge the gap between the relational
                        paradigm of SQL and high-level type systems of modern
                        programming languages. EdgeDB sidesteps this problem by
                        modeling data in an object-relational way.
                      </p>
                    </div>
                    <div className={styles.edgeqlIntroSection}>
                      <h6>Composable.</h6>
                      <p>
                        Unlike SQL, EdgeQL's syntax is readily composable;
                        queries can be cleanly nested to perform subqueries or
                        nested mutations.
                      </p>
                    </div>
                    <div className={styles.edgeqlIntroSection}>
                      <h6>Strongly typed.</h6>
                      <p>
                        EdgeQL is inextricably tied to EdgeDB's rigorous type
                        system. The type of all expressions is statically
                        inferred by EdgeDB.
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className={styles.edgeqlIntroSection}>
                      <h6>Easy deep querying.</h6>
                      <p>
                        EdgeQL takes advantage of the graph-relational nature
                        of EdgeDB schemas. Instead of tables and foreign keys,
                        EdgeDB lets you think in objects, properties, and
                        links. Deep queries that traverse links can be
                        represented cleanly, no JOINs required.
                      </p>
                    </div>
                    <div className={styles.edgeqlIntroSection}>
                      <h6>Designed for programmers.</h6>
                      <p>
                        EdgeQL prioritizes syntax over keywords; It uses{" "}
                        <code>{`{ curly braces }`}</code> to define
                        scopes/structures and the assignment operator{" "}
                        <code>:=</code> to set values. The result is a query
                        language that looks more like code and less like word
                        soup.
                      </p>
                    </div>
                  </div>
                </div>
                <p className={styles.dots}>⋯</p>
                <p className={styles.subtleText}>
                  All queries below assume the following schema.
                </p>
                <div
                  className={cn(
                    styles.exampleCode,
                    styles.codeContent,
                    styles.edgeqlIntroCode
                  )}
                >
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
  multi link villains := .<nemesis[is Villain];
}

type Movie {
  required property title -> str;
  multi link characters -> Person;
}`}
                    language={"sdl"}
                  />
                </div>
              </BackgroundBlock>
              <BackgroundBlock colour="f7f7f7" particleColour="ffffff">
                <section className={styles.section}>
                  <h3>Basic querying</h3>
                  <p>
                    It takes almost no time at all to learn the basics of
                    querying in EdgeQL. It combines the intuitiveness of an ORM
                    with the power of raw SQL.
                  </p>

                  <CodeExplainer
                    className={styles.codeExplainer}
                    blocks={[
                      {
                        name: "Selection sets",
                        language: "sdl",
                        code: `select Hero {
  id,
  name,
  secret_identity
};`,
                        explanation: `[
  {
    "id": "d3b353c6...",
    "name": "Peter Parker",
    "secret_identity": "Spider-Man"
  },
  {
    "id": "af512f80-9d33-11eb-9a94-eb1b8a4d31ed",
    "name": "Barry Allen",
    "secret_identity": "The Flash"
  }
]`,
                      },
                      {
                        language: "sdl",
                        name: "Filtering",
                        code: `select Hero {
  id,
  name,
  secret_identity
}
filter .name = "Tony Stark";`,
                        explanation: `[
  {
    "id": "d3b353c6...",
    "name": "Tony Stark",
    "secret_identity": ["Iron Man"]
  }
]`,
                      },
                      {
                        name: "Filter by ID",
                        language: "sdl",
                        code: `select Hero {
  id,
  name
}
filter .id = <uuid>'d3b353c6-9d33-11eb-aea4-67d68adf9596';`,
                        explanation: `To select an object by its "id" property, cast the id value from "str" to "uuid". UUIDs are represented as their own scalar type ("uuid"). The <X>{VALUE} syntax is general-purpose way to convert VALUE to type X (if allowed).

{
  "id": "d3b353c6...",
  "name": "Peter Parker",
  "secret_identity": "Spider-Man"
}`,
                      },
                      {
                        language: "sdl",
                        name: "Deep fetching",
                        code: `# no joins! no foreign keys!
select Hero {
  id,
  name,
  villains: {
    id, name
  } filter .name ilike 'The %'
}
filter .name = "Peter Parker";`,
                        explanation: `[
  {
    "id": "d3b353c6...",
    "name": "Peter Parker",
    "villains": [
      {
        "id": "0869eee3...",
        "name": "The Vulture"
      },
      {
        "id": "22c1f903...",
        "name": "The Green Goblin"
      }
    ]
  }
]`,
                      },
                      {
                        language: "sdl",
                        name: "Computed properties",
                        code: `# no joins! no foreign keys!
select Hero {
  id,
  name,
  all_caps_name := str_upper(.name),
  villain_list := array_agg(.villains.name)
}
filter .name = "Tony Stark";`,
                        explanation: `[
  {
    "id": "d3b353c6...",
    "name": "Tony Stark",
    "all_caps_name": "TONY STARK",
    "villain_list": [
      "The Mandarin",
      "Justin Hammer"
    ]
  }
]`,
                      },
                      {
                        language: "sdl",
                        name: "Backward links",
                        code: `select Hero {
  id,
  name,
  movie_appearances := .<characters[is Movie] {
    id,
    title
  }
}
filter .name = "Tony Stark";`,
                        explanation: `For convenience, you could also add \
"movie_appearances" as a computed property of the Hero schema.

[
  {
    "id": "d3b353c6...",
    "name": "Tony Stark",
    "movie_appearances": [
      {
        "id": "ea51ff9e...",
        "title": "Iron Man"
      },
      {
        "id": "10dd3610...",
        "title": "The Avengers"
      }
    ]
  }
]`,
                      },
                    ]}
                  />
                </section>
                <section className={styles.section}>
                  <h3>Mutation</h3>
                  <p>
                    EdgeQL makes inserts, updates, upserts, deletes a breeze.
                    Plus, its composable syntax makes nested mutations and
                    upserts a joy to write.
                  </p>
                  <CodeExplainer
                    className={styles.codeExplainer}
                    blocks={[
                      {
                        language: "sdl",
                        name: "Insert",
                        code: `insert Hero {
  name := "Sam Wilson",
  secret_identity := "The Falcon"
}`,
                        explanation: `{"id": "5f22912a..."}`,
                      },
                      {
                        language: "sdl",
                        name: "Update",
                        code: `update Hero filter .name = "Sam Wilson" set {
  secret_identity := "Captain America"
}`,
                        explanation: `{"id": "5f22912a..."}`,
                      },
                      {
                        language: "sdl",
                        name: "Delete",
                        code: `delete Hero filter .name = "Peter Parker";`,
                        explanation: `This will fail if the Spider-Man record is \
referenced via link by another node.`,
                      },
                      {
                        language: "sdl",
                        name: "Nested inserts",
                        code: `insert Villain {
  name := "Doctor Octopus",
  nemesis := (insert Hero {
    name := "Peter Parker",
    secret_identity := "Spider-Man"
  })
}`,
                        explanation: `{"id": "d17d3ebe..."}`,
                      },
                      {
                        language: "sdl",
                        name: "Upsert",
                        code: `with
  hero_name := "Peter Parker",
  secret_identity := "Spider-Man"
insert Hero {
  name := hero_name,
  secret_identity := secret_identity
}
unless conflict on (.name)
else (
  update Hero filter .name = hero_name set {
    secret_identity := secret_identity
  }
);`,
                        explanation: `This creates a new Hero named "Peter \
Parker" or updates the existing record if it already exists. You can use \
this construct to "catch" conflicts on multiple properties, as long as \
they each have an exclusive constraint.

UNLESS CONFLICT ON (.id, .name, .email);

The ELSE clause is optional. If you leave it off, the query will return \
an empty set when a conflict occurs.`,
                      },
                    ]}
                  />
                </section>
                <section className={styles.section}>
                  <h3>Advanced features</h3>
                  <p>
                    EdgeQL is no toy language; it supports polymorphic queries,
                    a full slate of built-in convenience functions, JSON
                    casting, and more.
                  </p>
                  <CodeExplainer
                    className={styles.codeExplainer}
                    blocks={[
                      {
                        language: "sdl",
                        name: "Subqueries",
                        code: `select Hero {
  id,
  name,
  movies := (
    select Movie {
      id, title
    } filter Hero in .characters
  )
}`,
                        explanation: `SQL's lack of query composability is one of \
its biggest drawbacks. EdgeQL was designed with nestable subqueries \
in mind from the beginning.

[
  {
    "id": "90a2457e...",
    "name": "Tony Stark",
    "movies": [
      {
        "id": "98ac6cf2...",
        "title": "The Avengers"
      }
    ]
  },
  ...
]
`,
                      },
                      {
                        language: "sdl",
                        name: "Unions",
                        code: `insert Movie {
  title := "The Avengers",
  characters := {(
    select Hero filter .secret_identity in {
      'Iron Man',
      'Captain America',
      'Thor',
      'Black Widow',
      'Hulk',
      'Hawkeye'
    }
  ) union (
    select Villain filter .name = "Loki"
  )}
};`,
                        explanation: `Any two sets can be merged with UNION. Here \
we merge a set of Heroes and a set of Villains in order to populate the \
"characters" field for a new Movie.`,
                      },
                      {
                        language: "sdl",
                        name: "With clauses",
                        code: `with
  hero_name := "Spider-Man",
  villain_name := "Doc Ock",
  hero := (
    select Hero filter .name = hero_name
  ),
insert Villain {
  name := villain_name,
  nemesis := hero
}`,
                        explanation: `Use with statements to break up complex \
queries and approximate the experience of a script-like variable declaration \
block.`,
                      },
                      {
                        language: "sdl",
                        name: "JSON casting",
                        code: `select <json>(
  select Hero { id, name }
  filter .name = "Peter Parker"
);`,
                        explanation: `Cast any value to a JSON string by \
prepending it with <json>. JSON values are fully indexable.

'{ "id": "983d7858-b28c-11eb-bdf1-f390a8e5328f", "name": "Peter Parker" }'`,
                      },
                      {
                        language: "sdl",
                        name: "Aggregation",
                        code: `select Hero {
  id,
  name,
  num_villains := count(.villains),
  movie_titles := array_agg(
    .<characters[is Movie].title
  ),
}
filter .name = "Tony Stark";`,
                        explanation: `Aggregation functions convert \
result sets into primitive types like arrays (array_agg) or numbers (count).

Read the full list of built-in aggregation functions at \
https://www.edgedb.com/docs/edgeql/funcops/set

[
  {
    "id": "d3b353c6...",
    "name": "Tony Stark",
    "num_villains": 12,
    "movie_titles": [
      "Iron Man",
      "The Avengers",
      "..."
    ]
  }
]`,
                      },
                      {
                        language: "sdl",
                        name: "Type intersections",
                        code: `select Movie {
  id,
  title,
  heroes := .characters[is Hero] {
    id,
    name,
    secret_identity
  },
  villains := .characters[is Villain] {
    id,
    name
  }
};`,
                        explanation: `Filter sets containing a mix of different \
types with the [is Type] intersection operator.

{
  "id": "98ac6cf2...",
  "title": "The Avengers",
  "heroes": [
    {
      "id": "1f0daf38...",
      "name": "Sam Wilson",
      "secret_identity": "Captain America"
    },
    {
      "id": "de2beace...",
      "name": "Captain America",
      "secret_identity": "Captain America"
    },
    {
      "id": "90a2457e...",
      "name": "Tony Stark",
      "secret_identity": "Iron Man"
    }
  ],
  "villains": [
    {
      "id": "8320f14a...",
      "name": "Loki"
    }
  ]
}`,
                      },
                      {
                        language: "sdl",
                        name: "Polymorphism",
                        code: `select Person {
  id,
  type := .__type__.name,
  name,
  [is Hero].secret_identity,
  [is Villain].nemesis: { id, name }
};`,
                        explanation: `[
  {
    "id": "90a2457e...",
    "type": "default::Hero",
    "name": "Tony Stark",
    "secret_identity": "Iron Man"
  },
  {
    "id": "b49edc08...",
    "type": "default::Villain",
    "name": "Whiplash",
    "nemesis": {
      "id": "90a2457e...",
      "name": "Tony Stark"
    }
  }
]`,
                      },
                      {
                        language: "sdl",
                        name: "Introspection",
                        code: `select schema::ObjectType {
  name,
  is_abstract,
  prop_names := array_agg(.properties.name)
}
filter .name ilike "default::%";`,
                        explanation: `EdgeDB databases are fully \
introspectable, down to the most minute detail. For details read the \
Introspection docs at edgedb.com/docs/edgeql/introspection/index

[
  {
    "name": "default::Person",
    "is_abstract": true,
    "prop_names": ["id", "name"]
  },
  {
    "name": "default::Hero",
    "is_abstract": false,
    "prop_names": [
      "id",
      "name",
      "secret_identity"
    ]
  },
  {
    "name": "default::Villain",
    "is_abstract": false,
    "prop_names": ["id", "name"]
  },
  {
    "name": "default::Movie",
    "is_abstract": false,
    "properties": ["id", "title"]
  }
]`,
                      },

                      {
                        language: "edgeql",
                        name: "Grouping",
                        code: `group Hero { name }
by .number_of_movies`,
                        explanation: `[
  {
    key: {number_of_movies: 0},
    grouping: ['number_of_movies'],
    elements: [{name: 'Mr. Fantastic'}, ...]
  },
  {
    key: {number_of_movies: 1},
    grouping: ['number_of_movies'],
    elements: [{name: 'Quicksilver'}, ...]
  },
  ...,
  {
    key: {number_of_movies: 11},
    grouping: ['number_of_movies'],
    elements: [
      {name: 'Nick Fury'},
      {name: 'Iron Man'}
    ]
  },
]`,
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
                      (card) => card.href !== URLS.EDGEQL
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
