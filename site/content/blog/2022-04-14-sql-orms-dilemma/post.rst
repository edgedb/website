.. blog:authors:: colin
.. blog:published-on:: 2022-04-14 10:00 AM PT
.. blog:lead-image:: images/orms.jpg
.. blog:guid:: 7d2fb0cb-9cae-4bd8-93a5-42551228ec18
.. blog:description::
    The "ORM vs. SQL" holy war has raged for decades. EdgeDB provides a third option.

=====================================
A solution to the SQL vs. ORM dilemma
=====================================

In the classic 2006 blog post `The Vietnam of Computer Science <http://blogs.tedneward.com/post/the-vietnam-of-computer-science/>`_, Ted Neward likens the use of object-relational mapping tools to America's involvement in Vietnam.

.. pull-quote::

  In the case of Vietnam, the United States political and military apparatus was faced with a deadly form of the Law of Diminishing Returns. In the case of automated Object/Relational Mapping, it's the same concern—that early successes yield a commitment to use O/R-M in places where success becomes more elusive, and over time, isn't a success at all due to the overhead of time and energy required to support it through all possible use-cases.

Neward compares the use of ORM libraries to entering the Vietnam war. Inevitably, he argues, you'll end up in a hairy situation that's difficult to extricate yourself from. Switching from your ORM to using raw SQL will be slow and painful, just like withdrawing from Vietnam.

This analogy strikes me as a bit odd. In withdrawing from Vietnam, the U.S. and its allies exited the conflict and adopted a policy of non-intervention in Vietnam's political affairs. But when it comes to SQL vs. ORM, there's no way to exit the conflict. If you're using a relational database, you either use an ORM or you use SQL; "withdrawing" isn't an option. Eschewing ORMs for raw SQL isn't analogous to withdrawing from Vietnam; it's more like joining the Viet Cong. (Hey, it's not my analogy!)

The real "Vietnam of computer science" is *the SQL vs ORM debate itself*. It's an ideological war that's been raging for decades, everyone must take a side, and nobody wins.

.. In hindsight, this post and it's younger cousin `What ORMs Have Taught Me <https://wozniak.ca/blog/2014/08/03/1/index.html>`_ are showing their age somewhat. They both have a narrow conception of what an ORM is: a set of (possibly auto-generated) classes that contain properties, a ``.save()`` to tables in the underlying database. In other words,  It's usage examples assume a  assuming (as you'd expect from 2006) that all ORMs  dated in its analysis, mostly due to it's limited perception of  in it's narrow perception of what an ORM *is*. In those days, ORMs were

.. In other ways, though, comparing the "SQL vs. ORM" debate to Vietnam is extremely apt. It's an ideological war that's been raging for decades, both sides have taken heavy losses, and—ultimately—no one is right.

The debate, summarized
----------------------

The only way to end such an entrenched conflict is to reframe the entire debate. We need a third option that combines the strengths of ORMs and SQL with none of their weaknesses. But what are these strengths and weaknesses? To get everyone on the same page, let's rehash this tired debate...hopefully for the last time.

.. The major battles
.. -----------------

I've broken down the debate into a number of major discussion points; I'll summarize each as succinctly and impartially as possible.

- Schema representation
- Migrations
- Query syntax
- Result structure
- Language integration
- Performance
- Power

Schema representation
^^^^^^^^^^^^^^^^^^^^^

In SQL, your schema defined by the set of all data definition language (DDL) commands (e.g. ``CREATE DATABASE users;``) that have been executed against your database. Typically these DDL commands are represented as an ordered set of migration files that can be progressively applied as the schema evolves. Some SQL flavors automatically track the history of all DDL commands; all provide utilities for introspecting the current state of the schema.

.. code-block:: sql

  CREATE TABLE persons (
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    name text NOT NULL
  );
  CREATE TABLE blog_posts (
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    title text NOT NULL,
    author_id uuid references persons(id)
  );

ORM users argue this *imperative* approach to schema modeling isn't developer-friendly, as there's is no written representation of your schema. This makes it difficult to conceptualize the current schema state.

Instead, ORMs provide a way to write your schema *declaratively*, via class definitions, a data structure, a custom schema definition language, or some other mechanism. Vitally, this representation is usually *object-oriented*, meaning a "model" can contain explicit references to other models, such as  ``author`` in the (pseudo-code) example below:

.. code-block:: typescript

  class Person {
    name: string
  }

  class BlogPost {
    title: string
    author: Person
  }

**An aside about ORMs**

Many older critiques of SQL (including the Vietnam essay, which was written in 2006) assume the Active Record paradigm, in which SQL tables are mapped to corresponding classes. Instances of these classes are intended to correspond and synchronize directly with the underlying database row. The API looks something like this:

.. code-block:: typescript

  const user = new User('user_1234');
  user.name = "Bobby Tables";
  await user.save();

This introduces complications surrounding overfetching (Neward's "partial object problem") and object identity. However these issues are specific to strictly object-oriented languages, in which all objects must be an instance of a class. Neward addresses this:

.. pull-quote::

  Note that some object-based languages, such as ECMAScript, view objects differently than class-based languages, such as Java or C# or C++, and as a result, it is entirely possible to return objects which contain varying numbers of fields. That said...until such languages become widespread, such discussion remains outside the realm of this essay.

Well, it's fair to say JavaScript and Python are now widespread! This post is primarily written with modern slate of JavaScript and Python ORMs in mind. Broadly speaking, these libraries:

- follow the `data mapper pattern <https://orkhan.gitbook.io/typeorm/docs/active-record-data-mapper>`_, in that they return "plain" data structures instead of class instances;
- provide a more functional API;
- depend on object/dictionary literals extensively in their APIs for things like field selection;

.. code-block:: typescript

  await User.update('user_1234', {
    name: "Bobby Tables"
  });

.. These association keys (like ``author`` in the example above) don't exist under the relational paradigm. Instead, the ``BlogPost`` table would contain a scalar-valued attribute called ``author_id`` with a foreign key constraint on ``Person``.   and pave the way for object-oriented nested fetching APIs.

.. .. code-block:: typescript

..   BlogPost.query({
..     title: true,
..     author: {
..       name: true
..     }
..   })


Migrations
^^^^^^^^^^

The declarative modeling approach begs the question: is the ORM intended as the single source of truth for schema information?

- *If not*, then you have the *dual schema problem*. You must keep your ORM definition in sync with the schema of the underlying database, which is presumably modified using another SQL migration tool. This violates the `DRY principle <https://en.wikipedia.org/wiki/Don%27t_repeat_yourself>`_ and increases maintenence burden.

- *If so*, then the ORM must provide a migration mechanism: a way to linearize the evolution of the schema models into a series of imperative migration steps (usually DDL scripts). Technically, this also violates the DRY principle, since the same schema is represented in both a declarative and an imperative form (DDL), though this a bit of a gray area, since the DDL is typically auto-generated.

  SQL users contend that these auto-generated migration systems are error-prone, don't properly handle complex changes such as renames, and rarely support *data migrations* in the scenarios where they are needed. It's simpler and safer to hand-write SQL migration logic.

Query syntax
^^^^^^^^^^^^

ORMs simplify the experience of interacting with a database; they provide a stripped-down data model and CRUD API that's comparatively easy to learn relative to SQL. SQL has a steep learning curve, for a number of reasons.

- It's a large language with hundreds of keywords, grammar rules, and statement types.
- Due to the large API surface, there are many inconsistencies and edge cases (the treatment of ``null``, for instance).
- Its `clause ordering is unexpected <https://jvns.ca/blog/2019/10/03/sql-queries-don-t-start-with-select/>`_, especially the fact that ``select`` precedes ``from``.
- Broadly, SQL and the relational paradigm seem foreign to programmers who are accustomed to thinking about problems in an object-oriented way.

On the other hand, you only have to learn it once. SQL is a largely transferrable skill, since SQL is a universal query langauge; it even has an `ISO standard <https://en.wikipedia.org/wiki/SQL:2016>`_.

By contrast, no two ORM APIs are alike. They provide non-native, language-specific ways to model your schema and write queries. You need to learn a new API whenever you switch to the new ORM-du-jour. Plus, as your application gets more complex, you'll likely hit the limits of what your ORM can represent, in which case you'll need to fall back to SQL anyway

Result structure
^^^^^^^^^^^^^^^^

All SQL queries return a list of scalar-valued tuples, even when ``JOINing`` and ``SELECTing`` from referenced tables.

.. code-block:: sql

  SELECT name, posts.title AS post_title
  FROM
    users
    LEFT JOIN
    posts ON posts.author_id = users.id

.. code-block::

  name     | post_title
  -------------------------------------------------
  "Anakin" | "Why I don't like sand"
  "Anakin" | "One weird trick to surviving lava"
  "Anakin" | "I've got a bad feeling about this"

To make the results more easily consumed by the client, it's common to reformat the results into a structured object/dictionary, which introduces complexity into application logic.

.. note::

  It's possible to do JSON aggregation and nesting in some modern SQL databases, but the mechanisms are inconsistent, verbose, and tedious.

By contrast, ORMs provide an object-oriented API for nested fetching that returns a structured object that is more immediately useful than SQL's "array of arrays".

.. code-block::

  {
    "name": "Anakin",
    "posts": [
      {"title": "Why I don't like sand"},
      {"title": "One weird trick to surviving lava"},
      {"title": "I've got a bad feeling about this"},
    ]
  }


Language integration
^^^^^^^^^^^^^^^^^^^^

ORMs provide a code-first API to express queries, whereas raw SQL queries are often expressed as plain strings. These query strings are often more concise than the equivalent ORM operation and allow queries to be represented in a language-agnostic way.

On the other hand, ORM APIs can benefit from programming language's functionality, syntax highlighting, autocompletion, auto-formatting, and other tooling that is increasingly common in modern dev environments.

But perhaps the most important consideration is the ability of ORMs to provide fully-typed query results inside statically typed languages like TypeScript. Without an ORM, users must write both the SQL queries *and* its expected type signature, and manually keep them in sync. This violates the DRY principle and increases maintenance burden on the developer.

Performance
^^^^^^^^^^^

Since ORMs usually execute SQL queries under the hood, they can only hope to match the performance of an equivalent optimized SQL query; in practice, though, ORMs are often much slower.

Nested fetch operations are typically split into a set of simpler, serially-executed SQL queries. This requires several round-trip requests to the database; depending on the server-database latency characteristics, this can have `disastrous performance ramifications <https://github.com/edgedb/imdbench>`_.

On the other hand, a naive approach to writing highly connected (JOIN-heavy) queries in SQL will result in a cartesian explosion in the result set (AKA a "join bomb") that can severely hurt performance.

.. code-block:: sql

  SELECT name, f.username, p.title, c.content
  FROM
    users u
    LEFT JOIN follows ON follows.target_id = u.id
    LEFT JOIN users f ON follows.source_id = f.id
    LEFT JOIN posts p ON posts.author_id = u.id
    LEFT JOIN comments c ON comments.post_id = p.id

  -- 10 gazillion results returned


Power
^^^^^

ORMs provide a limited set of CRUD functionality: simple queries, nested queries, the ability to filter by some limited set of operators, nested mutations, inserts, updates, and deletes. Advanced options may support upserts, basic aggregations, and grouping.

.. ORMs typically support an array of backend databases, causing a *least-common denominator* problem; all functionality the ORM provides must be expressible by the full set of supported backends. Even if one database provides a more performant way to represent a certain operation, an ORM will typically produce a slower query that is more broadly compatible.

SQL, by contrast, is a full-fledged query language that supports a full library of functions and operators, computed properties, subqueries, window functions, advanced grouping and analytical queries, type conversion operations, set operations like ``union`` and ``distinct``, common table expressions, recursive queries...the list goes on.

And that's just the query language; SQL schemas are also richer and more sophisticated. They have a rich typesystem consisting of string, boolean, numeric, geometric, monetary, temporal, and geographical datatypes, plus computed properties, stored procedures, database views, triggers, and more.


The third option
----------------

Ultimately, both SQL and ORMs come with serious tradeoffs. Other considerations like query representation are merely a matter of taste. Developers are forced to choose the least bad option, in the context of their application requirements, programming langauge, and personal preferences.

Here at EdgeDB, we want everyone to get along. Baking a cake filled with rainbows and smiles didn't work, so instead we built EdgeDB, something that–hopefully—everyone can agree on.

For some high-level context, EdgeDB:

- is an open-source database.
- is stable (post-1.0).
- is implemented as a non-leaky layer on top of Postgres (which lets it take advantage of Postgres's incredible query engine and feature set).
- has an associated query language called EdgeQL, designed as a spiritual successor to SQL.

Let's break it down.

.. EdgeDB is an `open-source <https://github.com/edgedb/edgedb>`_ database with a full-fledged query language called EdgeQL that is `rapidly approaching </roadmap>`_ feature parity with SQL, a schema definition  Let's break it down.

Schema representation
^^^^^^^^^^^^^^^^^^^^^

EdgeDB schemas are expressed in ``.esdl`` files using our *declarative*, *object-oriented* schema declaration language.

.. code-block:: sdl

  # default.esdl

  type Movie {
    required property title -> str;
    multi link actors -> Person;
  }

  type Person {
    required property name -> str;
  }

EdgeDB has a robust type system that's most comprehensive that most ORMs, but without the bloat that's common among RDBMSs.

.. code-block::

  str
  bool
  int16
  int32
  int64
  float32
  float64
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

  # plus enums, arrays, and tuples

These primitive data types form the building blocks for declaring *object types*, which contain *properties* and *links* to other object types. The "link" concept allows object to directly reference other objects, like "associations" or "relations" in ORM parlance.

Computed properties, indexes, constraints, default values, and custom scalar types are fully supported. Under the hood, everything is stored in a fully normalized way.

Migrations
^^^^^^^^^^

Migrations are created interactively via the ``edgedb`` command-line tool. Your current schema files are compared against the current database schema and outputs edgeql files that contain DDL commands.

.. code-block:: bash

  $ edgedb migration create
  Did you create object type 'Movie'? [y/n]
  > y
  Did you create object type 'Person'? [y/n]
  > y
  Created ./dbschema/migrations/00001.edgeql.

The migration planning logic is built into the database itself, not the CLI or a third-party tool. Similarly, migration history is automatically tracked and fully introspectable. Migrations are represented as ``.edgeql`` files containing DDL commands.

.. code-block:: edgeql

  CREATE MIGRATION m1ug4vx3zouenfd3vdp3uxu2j62ng74n5np7pk7orsvypeykuxpowq
    ONTO initial
  {
    CREATE TYPE default::Person {
      CREATE REQUIRED PROPERTY name -> std::str;
    };
    CREATE TYPE default::Movie {
      CREATE MULTI LINK actors -> default::Person;
      CREATE REQUIRED PROPERTY title -> std::str;
    };
  };

Users who prefer imperative schema modeling can write migration scripts directly. Those who prefer declarative modeling can use SDL. Or mix-and-match; it's entirely possible to add custom DDL migrations alongside the auto-generated ones.

Query syntax
^^^^^^^^^^^^

EdgeQL is designed to solve some of SQL's more unintuitive design aspects. For starters, its object-oriented nature allows for JOIN-less deep fetching with a new syntactic structure: the *shape*.

.. code-block:: edgeql

  select Movie {
    title,
    actors: {
      name
    },
    reviews: {
      rating,
      author: {
        name
      }
    }
  } filter .title = "Dune"

Eliminating ``JOINs`` alone is a big step towards a query language that is more intuitive for developers who are primarily familiar with `object-based languages <https://en.wikipedia.org/wiki/Object-based_language>`_ (which is most of them).

Within the scope of the ``select`` statement, you can refer to links and properties with "leading dot notation", such as ``.title`` in the query above. This is another novel syntactic structure, known as a *path*. These are a powerful way to reference linked objects in a concise way.

.. code-block:: edgeql

  select Movie {
    title,
    actors: { name },
    num_actors := count(.actors), # computed property
    reviewers := .reviews.author.name, # another computed
  } filter "Zendaya" in .actors.name

Another key characteristic of EdgeQL is its *composability*; you can cleanly nest EdgeQL queries inside each other.

.. code-block:: edgeql

  insert Movie {
    title := "Spider-Man: No Way Home",
    director := (insert Person { name := "Jon Watts" }),
    actors := (
      select Person
      filter .name in {"Zendaya", "Tom Holland"}
    )
  }

This degree of composability isn't possible in SQL due to it's strict distinction between table expressions and scalar expressions. EdgeQL eliminates this distinction, opting instead for a more elegant :ref:`set-theoretic foundation <docs:ref_eql_everything_is_a_set>`.

.. By extension, there is no longer any concept of ``null``; instead, the absence of data is simply an empty set. (Empty sets will still be represented as ``null/nil/None`` when executing queries using one of EdgeDB's client libraries.) This eliminating an :ref:`entire class <ref_null_bag_of_surprises>` of rules and gotchas in SQL. Instead, the absence of data is simply an empty set.

Result structure
^^^^^^^^^^^^^^^^

Like ORMs, EdgeQL return a structured result that matches the visual structure of the query.

.. code-block:: edgeql

  select Movie {
    title,
    actors: {
      name
    }
  }

.. code-block::

  {
    "title": "Dune",
    "actors": [
      {name: "Timothee Chalamet"},
      {name: "Jason Momoa"},
      {name: "Rebecca Ferguson"}
    ]
  }


Language integration
^^^^^^^^^^^^^^^^^^^^

EdgeQL queries can be written as strings, similarly to SQL.

.. code-block:: typescript

  import {createClient} from "edgedb";

  const client = createClient();
  const result = await client.query(`select Person { name }`);

We've also built a :ref:`query builder for TypeScript <docs:edgedb-js-qb>` that can represent *any EdgeQL query* and automatically *infers the result type*. The query builder is a schema-aware client for writing queries that is generated by introspecting your schema.

.. code-block:: typescript

  import {createClient} from "edgedb";
  import e from "../dbschema/edgeql-js"; // <- the query builder

  const client = createClient();

  const myQuery = e.select(e.Movie, movie => ({
    id: true,
    title: true,
    actors: { name: true},
    filter: e.op('Zendaya', 'in', movie.actors.name)
  }))

  const result = await myQuery.run(client);
  // { title: string; actors: { name: string }[] }[]


.. note::

  We'll be publishing a deep dive blog post shortly about the API design and implementation of the TypeScript query builder. A query builder for Python is currently under development.

.. Universality
.. ^^^^^^^^^^^^

.. EdgeQL may not be an ISO standard (yet), but it's an open-source non-proprietary language that other databases are free to adopt. Since EdgeDB is (currently) the only database that implements EdgeQL, there are no concerns about inconsistencies between implementations, as in SQL.

.. With respect to schema modeling, EdgeDB's SDL (schema definition language) provides a version-control-friendly way to declare your data model without coupling your schema models to a particular programming language or library. Relatedly, migrations are generated by the database itself, automatically tracked, and represented as plain ``.edgeql`` files.

.. Under the hood, EdgeQL queries are compiled into an equivalent SQL query.  that is executed against its underlying Postgres instance/cluster. This approach sidesteps the lowest-common denominator faced by ORMs that attempt to target multiple databases.

Performance
^^^^^^^^^^^

All EdgeQL queries are `compiled <https://www.youtube.com/watch?v=46z3CJaO2-Y&ab_channel=EdgeDB>`_ into a single, optimized PostgreSQL query that can be executed in a single round-trip, solving the ORM latency problem.

Since EdgeDB leverages Postgres's query engine, the compiled queries can leverage Postgres's legendary performance and feature set. For highly-connected JOIN-heavy queries, EdgeDB defuses the "join bomb" problem by performing all ``JOINs`` inside subqueries and aggregating the results, instead of naively ``JOINing`` at the top level. This solution isn't possible in all SQL implementations.

.. note::

  EdgeQL relies heavily on several Postgres features, like lateral joins, arrays and fast array aggregation, tuple indexing, and transactional DDL—none of which are universally supported.



.. .. code-block:: edgeql

..   select Movie {
..     id,
..     title,
..     actors: { name }
..   } filter .title = "Dune"

.. .. code-block:: sql

..   select
..     movies.id,
..     movies.title,
..     (select array_agg(cast_data) from (
..       select name
..       from actors
..       inner join person on person.id = actors.actor_id
..       where actors.movie_id = movies.id
..     ) as cast_data)
..   from movies
..   where title = "Dune"

Power
^^^^^

EdgeQL's composable nature, set-theoretic basis, robust system of types and casting, expressive *shape* and *path* syntax, JSON support, and comprehensive standard library of functions and operators makes it both powerful and intuitive.

.. code-block::

  select Movie {
    title,
    actors: { name },
    avg_rating := math::mean(.reviews.rating)
  }

Because EdgeQL and EdgeDB's schema definition language are closely married, your schema types can include :ref:`computed fields <docs:ref_datamodel_computed>`, :ref:`indexes <docs:ref_datamodel_indexes>`, and :ref:`constraints <ref_datamodel_constraints>` that correspond to complex EdgeQL expressions.

.. code-block:: sdl

  # default.esdl

  type Movie {
    required property title -> str;
    multi link actors -> Person;
    num_actors := count(.actors); # computed
  }

  type Person {
    required property name -> str {
      constraint min_length(0);
    };
    multi link acted_in := .<actors[is Movie]; # backlink
    index on (str_trim(.title));
  }

Abstract type mixins allows for the modeling sophisicated data domains without redundancy.

.. code-block:: sdl

  abstract type Item {
    required property name -> str;
    required property weight -> float64;
  }

  type Weapon extending Item {
    required property range -> int64;
  }

  type Shield extending Item {
    required property defense -> int64;
  }

  type Player {
    required property username -> str { constraint exclusive; }
    multi link inventory -> Item;
  }

And polymorphic queries allow for painless retrieval:

.. code-block:: edgeql

  select Player {
    name,
    inventory: {
      name,
      [is Weapon].range,
      [is Shield].defense,
    }
  }
  filter .username = "Zezima"

EdgeQL is a full-fledged query language that is rapidly approaching feature parity with SQL. The last major missing SQL feature is `group by <https://github.com/edgedb/edgedb/pull/3667>`_, which just landed in the 2.0 nightlies. Other features on the roadmap include access control (also coming in 2.0), database views, triggers, window functions, and GIS extensions; view the `full roadmap </roadmap>`_ for details.

Wrapping up
-----------

The object-relational impedance mismatch is not a law of nature. It can be overcome with the right abstraction. EdgeDB presents a third path; all you have to do is take it. 🐇

.. note::

  Dip your toe into EdgeDB with the :ref:`Quickstart <docs:ref_quickstart>` or head to `the GitHub repo <https://github.com/edgedb/edgedb>`_ for more resources.
