import React from "react";

import MainLayout from "@/components/layouts/main";

import CodeExplainer from "@/components/codeExplainer";

import styles from "@/styles/showcase.module.scss";
import MetaTags from "@/components/metatags";
import LearnCards from "@/components/learnCards";
import {
  BackgroundBlock,
  BackgroundFader,
} from "@/components/homepage/backgroundFader";
import WebGLWrapper from "@/components/homepage/webgl";
import {learnCardsExtended, URLS} from "../../dataSources/data";

export default function DataModelingPage() {
  return (
    <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
      <MetaTags
        title="Data modeling in EdgeDB"
        description={`EdgeDB provides a \
first-party declarative schema modeling language that \
integrates deeply with EdgeDB's query language, type \
system, and migration tools.`}
        relPath={URLS.DATA_MODELING}
      />
      <WebGLWrapper>
        <BackgroundFader usePageBackground>
          <div className="globalPageWrapper">
            <div className={styles.content}>
              <BackgroundBlock colour="ffffff" particleColour="f1f1f1">
                <h1>Data modeling in EdgeDB</h1>
                <div className={styles.intro}>
                  <p>
                    Most relational databases are inherently imperative; your
                    schema is represented as a sequence of schema modification
                    commands, usually fragmented across an array of migration
                    scripts. Needless to say, this is not a human-friendly way
                    to represent schema.
                  </p>
                  <p>
                    In search of more intuitive modeling tools, developers
                    often turn to ORM libraries and NoSQL options, which come
                    with their own tradeoffs.
                  </p>
                  <p>
                    EdgeDB solves this problem by introducing a first-party
                    declarative schema modeling language that integrates deeply
                    with EdgeDB’s query language, type system, and migration
                    tools.
                  </p>
                </div>
              </BackgroundBlock>
              <BackgroundBlock colour="f7f7f7" particleColour="ffffff">
                <section className={styles.section}>
                  <h3>Basic modeling</h3>
                  <p>
                    Schemas consist of object types—analogous to tables in
                    SQL—containing properties and links to other objects. The
                    "link" concept makes foreign key constraints unnecessary.
                  </p>
                  <CodeExplainer
                    className={styles.codeExplainer}
                    blocks={[
                      {
                        name: "Object types",
                        language: "sdl",
                        code: `type User {
  required first_name: str;
  middle_name: str;
}
`,
                        explanation: `No "id" property is required, as EdgeDB automatically generates a unique ID for every object in the database.`,
                      },
                      {
                        name: "Abstract types",
                        language: "sdl",
                        code: `abstract type HasName {
  required first_name: str;
  required last_name: str;
}

abstract type HasEmail {
  required email: str;
}

type User extending HasName, HasEmail {
  required password_hash: str;
}`,
                        explanation:
                          "Type composition makes it easy to split up complex or redundant schemas into manageable logical units.",
                      },
                      {
                        name: "Default values",
                        language: "sdl",
                        code: `type User {
  created_at: datetime {
    default := (select datetime_current());
  }
}`,
                        explanation: `The expression in parentheses can contain an arbitarily complex query to compute the default value.

As you can see, property declarations can be expanded to include a \"block\" of statements wrapped in curly braces. Blocks make your schema more explicit and readable.`,
                      },
                      {
                        name: "Computed properties",
                        language: "sdl",
                        code: `type User {
  name: str;
  multi friends: User;
  property uppercase_name := str_upper(.name);
  property now := datetime_of_statement();

  # computed backlink
  multi link tweets := User.<author[is Tweet];
}

type Tweet {
  author: User;
}`,
                        explanation: `Computed properties and links are declared with the \":=\" operator. These properties/links are non-materialized; EdgeDB re-computes them on the fly when they are referenced in a query.

Computed fields can contain any EdgeQL expression, including arbitary queries. The "User.now" property returns the datetime at which the query was executed. The "User.tweets" property fetches all Tweet objects that reference the User via a link called "author".`,
                      },
                      {
                        name: "Constraints",
                        language: "sdl",
                        code: `type User {
  name: str {
    constraint exclusive;

    # 8 characters min
    constraint min_len_value(8);

    # must start with A
    constraint expression on
      (__subject__[0] = 'A');
  }
}`,
                        explanation: `See all built-in constraints at https://www.edgedb.com/docs/datamodel/constraints.`,
                      },
                      {
                        name: "Indexes",
                        language: "sdl",
                        code: `type User {
  required first_name: str;
  required last_name: str;
  required email: str;
  index on (.email);
  index on (.first_name, .last_name);
  index on (str_lower(.email));
}`,
                        explanation: `Add single- or multi-column indexes, or specify a dynamic expression.`,
                      },
                    ]}
                  />
                </section>
                <section className={styles.section}>
                  <h3>Type system</h3>
                  <p>
                    EdgeDB's type system was designed from the ground up for
                    consistency and safety. Every piece of data stored by
                    EdgeDB is strongly typed.
                  </p>
                  <CodeExplainer
                    className={styles.codeExplainer}
                    blocks={[
                      {
                        name: "Scalar types",
                        language: "sdl",
                        code: `str
bool
int{16|32|64}
float{32|64}
bigint
decimal
sequence
datetime
duration
cal::local_datetime
cal::local_date
cal::local_time
uuid
json
enum<X,Y,[...]>
`,
                        explanation: `These scalar types underpin EdgeDB's type system, can be used as properties or composed into arrays and tuples. Read the Scalar docs for details, methods, and operators for each type:
https://www.edgedb.com/docs/datamodel/scalars/index`,
                      },
                      {
                        name: "Enums",
                        language: "sdl",
                        code: `scalar type RelationshipStatus {
  extending enum<Single, ItsComplicated, Married>;
}

type User {
  relationship_status: RelationshipStatus;
}`,
                        explanation: `Define custom enums by extending the base \`enum\` type.`,
                      },
                      {
                        name: "Arrays",
                        language: "sdl",
                        code: `type User {
  favorite_colors: array<str>;
  favorite_numbers: array<int64>;
}`,
                        explanation: `Currently nested arrays are not supported.`,
                      },
                      {
                        name: "Tuples",
                        language: "sdl",
                        code: `type User {
  # unnamed tuple
  bingo: <str, number>;

  # named tuple
  favorite_player: tuple<name: str, jersey_number: float64, active: bool>;
}`,
                        explanation: `The elements of a tuple can optionally be named. When converting to JSON, EdgeDB's client libraries will convert named tuples into hashmaps/objects instead of arrays.`,
                      },
                      {
                        name: "Custom scalars",
                        language: "sdl",
                        code: `scalar type Username {
  extending str;
  constraint min_len_value(8);
  constraint max_len_value(30);
};

type User {
  required username: Username;
}
`,
                        explanation: `Define custom scalars by extending any existing data type with constraints or defaults.`,
                      },
                    ]}
                  />
                </section>
                <section className={styles.section}>
                  <h3>Intuitive relations</h3>
                  <p>
                    EdgeDB introduces the concept of "links" for directly
                    creating connections between objects; this eliminates the
                    need for foreign key constraints.
                  </p>
                  <CodeExplainer
                    className={styles.codeExplainer}
                    blocks={[
                      {
                        name: "One-to-many",
                        language: "sdl",
                        code: `type User {
  required email: str;
}

type BlogPost {
  required content: str;
  required author: User;
}`,
                        explanation: `Modeling a one-to-many relation is simple and intuitive. Under the hood, a foreign key column referencing User will be added to the BlogPost table.`,
                      },
                      {
                        name: "One-to-one",
                        language: "sdl",
                        code: `type User {
  profile_picture: Photo {
    constraint exclusive;
  }
}

type Photo {
  required url: str;
}`,
                        explanation: `One-to-one relations require an exclusive constraint, which is analogous to UNIQUE in SQL. It guarantees that each Photo is only associated with a single User.`,
                      },
                      {
                        name: "Many-to-many",
                        language: "sdl",
                        code: `type User {
  multi likes: Tweet;
}

type Tweet {
  text: str;
}`,
                        explanation: `Tweets can be liked by many users, and users can like many tweets.`,
                      },
                      {
                        name: "Backward links",
                        language: "sdl",
                        code: `type User {
  multi likes: Tweet;
}

type Tweet {
  text: str;
  multi link likers := Tweet.<likes[is User];
}`,
                        explanation: `The "backward link" operator is ".<".
In this example \`Tweet.<likes\` is used to reference all object types that connect to "Tweet" via a link called "likes".

Since multiple object types may contain a link "likes" corresponding to "Tweet", we must add an additional type filter "[is User]". This is the type intersection operator, documented here:
https://www.edgedb.com/docs/edgeql/funcops/set#operator::ISINTERSECT.`,
                      },
                    ]}
                  />
                </section>
                <section className={styles.section}>
                  <h3>Advanced modeling</h3>
                  <p>
                    EdgeDB is no toy database. It aims to match or surpass SQL
                    in functionality, expressivity, consistency, and elegance.
                  </p>

                  <CodeExplainer
                    className={styles.codeExplainer}
                    blocks={[
                      {
                        name: "Modules",
                        language: "sdl",
                        code: `module auth {
  type User {
    # properties...
  };
}

module models {
  type BlogPost {
    author: auth::User;
  };
}`,
                        explanation: `Schemas can be split up into logical units called modules.

You can choose whether to define your whole schema inside the "default" module or split it into several. If you split it up, use the "{module}::" namespace prefix when referencing the type in other modules.`,
                      },
                      {
                        name: "Custom functions",
                        language: "sdl",
                        code: `function pig_latin(val: str) -> str
  using (
    select val[1:] ++ val[0] ++ 'ay'
  );`,
                        explanation: `Split commonly used logic into strongly-typed custom functions that can be easily defined alongside the rest of your schema.

edgedb> select pig_latin('hello');
'ellohay'`,
                      },
                      {
                        name: "Object-level constraints",
                        language: "sdl",
                        code: `type Event {
  required start_time: datetime;
  required end_time: datetime;
  constraint expression on
    (.start_time < .end_time);
}`,
                        explanation: `Specify custom compound constraints that reference multiple properties of an object type.`,
                      },
                      {
                        name: "Polymorphic links",
                        language: "sdl",
                        code: `module default {
  abstract type Person {
    required name: str;
  }

  type Hero extending Person {}
  type Villain extending Person {}

  type Movie {
    multi characters: Person;
  }
}`,
                        explanation: `Define polymorphic links that reference abstract types. Refer to the EdgeQL docs for details on writing polymorphic queries.`,
                      },
                      {
                        name: "Expression aliases",
                        language: "sdl",
                        code: `type User {
    required name: str;
    multi friends: User;
}

alias UserAlias := User {
    # declare a computed link
    friend_of := User.<friends[is User]
};`,
                        explanation: `Define aliases on a given type to add computed properties and links. You can reference aliases inside your EdgeQL queries just like real types.`,
                      },
                      {
                        name: "Unions",
                        language: "sdl",
                        code: `type File {
  required contents: str;
}

type Folder {
  required name: str;
  multi children: Folder | File;
}`,
                        explanation: `Links may reference unions of several object types.`,
                      },
                      {
                        name: "Link properties",
                        language: "sdl",
                        code: `abstract link friendship {
  started_at: datetime {
    default := (select datetime_current());
  };
  strength: float64;
}

type User {
  multi friends: User {
    extending friendship;
  }
}`,
                        explanation: `Tracking friendship duration and strength with link properties!`,
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
                      (card) => card.href !== URLS.DATA_MODELING
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
