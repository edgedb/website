.. blog:authors:: colin
.. blog:published-on:: 2022-07-01 10:00 AM PT
.. blog:lead-image:: images/banner.jpg
.. blog:guid:: 39810082-99ac-4038-9a31-18ec0cb96583
.. blog:description::
    We set out to build the a full-featured TypeScript query builder with static type inference. This post discusses our API design process and
    implementation.

===============================================
Designing the ultimate TypeScript query builder
===============================================

We set out to design a query builder for TypeScript that can *express queries* of *arbitrary complexity* while *inferring the return type* automatically.

It wasn't easy, but with the help of some of JavaScript's coolest modern features and some dark TypeScript wizardry, we think we pulled it off. The result is something that provides the best of all worlds: the typesafety of an ORM coupled with the expressive power of a full-fledged query language.

You can play with the query builder now! We recommend cloning our `MCU sandbox <https://github.com/edgedb/mcu-sandbox>`_ repo and following the instructions to initialize the project—should take under a minute.


The sequel to SQL
-----------------

Important note: this is a query builder for *EdgeQL*, the object-oriented query language of EdgeDB. It's designed as a spiritual successor to SQL, and solves some it's biggest usability issues. Throughout this post, click the "EdgeQL" tab to see the EdgeQL equivalent of each query builder expression.

.. tabs::

  .. code-tab:: typescript

    const query = e.select(e.Movie, movie => ({
      id: true,
      title: true,
      actors: {
        name: true,
      },
      filter: e.op(movie.title, '=', 'Iron Man 3')
    }));

    // inferred type:
    // { id: string; title: string; actors: { name: string }[]}

  .. code-tab:: edgeql

    select Movie {
      id,
      title,
      actors: {
        name
      }
    }
    filter .title = "Iron Man 3"

Note the GraphQL-style "selection shape" to specify which fields to fetch. As you'd expect, this query returns a structured JSON-like result, not a flat list of rows.


.. code-block::

  {
    "id": "9278d96e-1932-44e4-a9b3-34e49b592c26",
    "title": "Iron Man 3",
    "release_year": 2013,
    "actors": [
      { "name": "Robert Downey Jr." },
      { "name": "Gwyneth Paltrow" },
      { "name": "Ben Kingsley" }
    ]
  }

The query above assumes the following schema, as defined with EdgeDB's :ref:`schema definition language <docs:ref_datamodel_index>`.

.. code-block:: sdl

  type Movie {
    required property title -> str;
    property release_year -> int64;
    multi link actors -> Person;
  }

  type Person {
    required property name -> str;
  }

**Generating the query builder**

To get started with the query builder, you'll need to spin up an EdgeDB instance. The easiest way to do so it to install the EdgeDB CLI and run ``edgedb project init`` in your project directory. Follow :ref:`the quickstart <ref_quickstart>` for a more complete introduction.

Then install the ``edgedb`` package from NPM and executing the following ``npx`` command.

.. code-block:: bash

  $ npm install edgedb
  $ npx edgeql-js

This command introspects your database and generates a handful of files into the ``dbschema/edgeql-js`` directory. (By convention, ``dbschema`` is the directory used to store anything EdgeDB-related, like schema and migration files.) We recommend importing the query builder as a single variable called ``e``.

.. code-block:: typescript

  import e from "./dbschema/edgeql-js";

This variable contains everything you need to define arbitrarily complex EdgeQL queries, but let's start small: a "Hello World" query.

.. code-block:: typescript

  import e from "./dbschema/edgeql-js";

  const query = e.select("hello world!");

The ``e.select`` function returns an *object* that represents an EdgeQL queries; we'll refer to this as a "query builder expression" or simply "expression".

To execute the expression, pass a *client* into the expression's ``.run()`` method.

.. note:: The ``createClient`` function returns an instance of ``Client``: a class that manages a pool of connections to your EdgeDB instance and provides a simple API for executing queries.

.. code-block:: typescript

  import {createClient} from "edgedb";
  import e from "./dbschema/edgeql-js";

  const client = createClient();

  const query = e.select("Hello world!");
  const result = await query.run(client);
  // => "Hello world!"


The ``.run`` method returns a strongly typed Promise; the query builder automatically infers the return type of all expressions. In the example above ``result`` has a ``string`` type. You can extract this type with the ``$infer`` helper.

.. code-block:: typescript

  import {createClient} from "edgedb";
  import e, {$infer} from "./dbschema/edgeql-js";

  const client = createClient();

  const query = e.select("Hello world!");
  type query = $infer<typeof query>;
  // string

Let's start looking at some non-trivial queries.

Inserting objects
-----------------

Use the ``e.insert`` function to write ``insert`` queries.

.. tabs::

  .. code-tab:: typescript

    e.insert(e.Movie, {
      title: "Doctor Strange in the Multiverse of Madness",
      release_year: 2022
    });

  .. code-tab:: edgeql

    insert Movie {
      title := "Doctor Strange in the Multiverse of Madness",
      release_year := 2022
    }

The first argument is an *object type*; these are auto-generated by the query builder. The second argument contains the data to be inserted. Note that we aren't including an ``id`` property; that gets autogenerated by EdgeDB.

Since the ``title`` property has type ``str``, ``e.insert`` naturally expects a string value. Similarly ``release_year`` has type ``int64``, so it expects a number. The table below maps each EdgeDB scalar type to its closest TypeScript equivalent.

.. list-table::

  * - **EdgeDB type**
    - **JavaScript type**
  * - ``str``
    - ``string``
  * - ``bool``
    - ``boolean``
  * - ``float32`` ``float64`` ``int16`` ``int32`` ``int64``
    - ``number``
  * - ``json``
    - ``string``
  * - ``uuid``
    - ``string``
  * - ``bigint``
    - ``BigInt``
  * - ``decimal``
    - N/A (not supported)
  * - ``bytes``
    - ``Buffer``
  * - ``datetime``
    - ``Date``
  * - ``duration``
    - :js:class:`Duration`
  * - ``cal::local_date``
    - :js:class:`LocalDate`
  * - ``cal::local_time``
    - :js:class:`LocalTime`
  * - ``cal::local_datetime``
    - :js:class:`LocalDateTime`

For certain types like ``duration`` that have no JavaScript equivalent, we've implemented custom classes to represent that data type.

Nested inserts
^^^^^^^^^^^^^^

As in EdgeQL, subqueries are completely painless; to do nested inserts, just drop one ``e.insert`` into another.

.. tabs::

  .. code-tab:: typescript

    e.insert(e.Movie, {
      title: "Iron Man",
      release_year: 2008,
      actors: e.set(
        e.insert(e.Person, { name: "Robert Downey Jr." }),
        e.insert(e.Person, { name: "Gwyneth Paltrow" })
      ),
    });

  .. code-tab:: edgeql

    insert Movie {
      title := "Iron Man",
      release_year : 2008,
      actors := {
        (insert Person { name := "Robert Downey Jr." }),
        (insert Person { name := "Gwyneth Paltrow" })
      }
    }

.. note::

  Above, we're using the ``e.set`` function to define a *set literal*. In EdgeQL this is indicated with curly braces: ``select {'a', 'b', 'c'}``


Selecting objects
-----------------

Now onto the meat and potatoes: *selecting objects*. Let's start by selecting all movies in the database.

.. tabs::

  .. code-tab:: typescript

    const query = e.select(e.Movie, () => ({
      id: true,
      title: true
    }));

    const result = await query.run(client);
    // {id: string; title: string;}[]

  .. code-tab:: edgeql

    select Movie {
      id,
      title,
      release_year
    }

As a shorthand for selecting all properties of an object, use the spread operator in conjunction with the special ``*`` property. This is a query builder feature with no EdgeQL equivalent (yet); plain EdgeQL doesn't support ``select *`` functionality.

.. code-block:: typescript

  const query = e.select(e.Movie, () => ({
    ...e.Movie['*']
  }));

  const result = await query.run(client);
  /* {
    id: string;
    title: string;
    release_year: number | null;
  }[] */

As you'd expect, the type of the ``release_year`` property is ``number | null`` as it's an optional property.

Nesting shapes
^^^^^^^^^^^^^^

Shapes can be nested to fetch linked objects, like ``actors``.

.. tabs::

  .. code-tab:: typescript

    const query = e.select(e.Movie, () => ({
      title: true,
      actors: {
        name: true,
      }
    }));

    const result = await query.run(client);
    // { title: string, actors: {name: string}[] }[]

  .. code-tab:: edgeql

    select Movie {
      title,
      actors: {
        name
      }
    }


Adding computed properties
^^^^^^^^^^^^^^^^^^^^^^^^^^

At this point you may be wondering why the second argument to ``e.select`` is a function instead of a simple object. Well: the query builder can do a lot more than simple GraphQL-style selection sets. For starters you can define *computed properties*.

.. tabs::

  .. code-tab:: typescript

    const query = e.select(e.Movie, (movie) => ({
      title: true,
      title_upper: e.str_upper(movie.title),
      cast_size: e.count(movie.actors)
    }));

    const result = await query.run(client);
    // { title: string; title_upper: string; cast_size: number }[]

  .. code-tab:: edgeql

    select Movie {
      title,
      title_upper := str_upper(.title),
      cast_size := count(.actors)
    }

Our "shape function" now has an argument: ``movie``. This variable represents the "scope"; we can use it to reference the properties and links of the user(s) we're selecting. In this case, we're defining some simple computed expressions using two built-in functions: ``e.count`` and ``e.str_upper``; the query builder reflects the entire :ref:`EdgeDB standard library <docs:ref_std>`.

Oh, and note that the query builder correctly inferred the type of ``title_upper`` and ``cast_size``! The result of this query would be something like this:

.. code-block:: json

  [
    {
      title: "Iron Man",
      title_upper: "IRON MAN",
      cast_size: 2
    },
    // etc.
  ]

Adding filters
^^^^^^^^^^^^^^

To add a ``filter`` clause to your select query, include the special ``filter`` key in your shape. This key expects a boolean expression; most commonly this will expression will involve an *operator* such as ``=``, ``>=``, ``++``, ``not``, and ``or``; operators are expressed with the ``e.op`` function.

Below, we're selecting all movies with a title containing "matrix" (case insensitive).

.. tabs::

  .. code-tab:: typescript

    e.select(e.Movie, (movie) => ({
      title: true,
      release_year: true,
      filter: e.op(movie.title, "ilike", "%matrix%"),
    }));

  .. code-tab:: edgeql

    select Movie {
      title,
      release_year
    } filter .title ilike "%matrix%"

Depending on their associated *EdgeDB type*, expressions can have various properties and methods. For instance, expressions corresponding to ``str`` values (such as ``movie.title`` above) can be easily indexed and sliced. (This is also true for ``array``, ``tuple``, and ``json`` expressions.)

.. code-tab:: typescript

  movie.title[0];
  movie.title.slice(0, 10);

Remember that ``movie.title`` is not a string! It is an *object* representing a *query* that returns a string. Moreover, ``movie.title[0]`` returns yet another expression. The query builder implements this "magic indexing" with the help of the `Proxy API <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy>`_.

We can use this to select all movies that begin with the letter "A".

.. tabs::

  .. code-tab:: typescript

    e.select(e.Movie, (movie) => ({
      title: true,
      release_year: true,
      filter: e.op(movie.title[0], "=", "A"),
    }));

  .. code-tab:: edgeql

    select Movie {
      title,
      release_year
    } filter .title[0] = "A"


A flat API
^^^^^^^^^^

At this point, you may be thinking that the shape is getting a little crowded. Why are we using a single object to define our field selection, computed properties, and filters? Won't there be key conflicts?

Actually, no! This is a very intentional decision. EdgeQL reserves certain keywords like "filter" so it can't be easily be used as a property or link name. As for computed fields, those aren't allowed to "overwrite" a property/link inside a selection shape; TypeScript (and EdgeQL) will throw an error.

With this API, each layer of query depth corresponds to a single layer of object nesting.

.. code-block:: typescript

  e.select(e.Movie, (movie) => ({
    id: true,
    title: true,
    actors: (actor) => ({
      name: true,
      filter: e.op(actor.name, "ilike", "chris")
    }),
    filter: e.op(movie.release_year, "=", 2022)
  }));


Prisma vs EdgeDB
****************

Contrast this with the more verbose syntax of modern JavaScript ORMs. Prisma requires two layers of *object nesting* for each additional layer of query depth. Here's the same query expressed with the Prisma client.

.. code-block:: typescript

  prisma.movie.findMany({
    where: {
      release_year: {
        eq: 2022
      }
    },
    select: {
      id: true,
      title: true,
      actors: {
        select: {
          name: true
        },
        where: {
          name: {
            contains: "chris",
            mode: "insensitive"
          }
        }
      }
    }
  });

Inferring cardinality
^^^^^^^^^^^^^^^^^^^^^

The query builder is smart enough to know when you are trying to select a single object. For instance:

.. code-block:: typescript

  const query = e.select(e.Movie, (movie) => ({
    title: true,
    filter: e.op(movie.id, '=', e.uuid('2053a8b4-49b1-437a-84c8-e1b0291ccd9f'))
  }));

  const result = await query.run(client);
  // { title: string } | null

The inferred result type is ``{ title: string } | null``. If you instead filter on a non-exclusive property like ``release_year``, the result will be an array.

.. code-block:: typescript-diff

      const query = e.select(e.Movie, (movie) => ({
        title: true,
  -     filter: e.op(movie.id, '=', e.uuid('2053a8b4-49b1-437a-84c8-e1b0291ccd9f'))
  +     filter: e.op(movie.release_year, '=', 2022)
      }));

      const result = await query.run(client);
      // { title: string }[]

The query builder detects when you filter on a property with an exclusive (uniqueness) constraint (e.g. ``.id``) with the equality operator (``=``). Under these circumstances, the query can only return zero or one objects; this is reflected in the inferred type. So there's no need for separate APIs for ``.findOne`` and ``.findMany``—the query builder can figure it out.

Ordering and paginating
^^^^^^^^^^^^^^^^^^^^^^^

The special ``order_by`` key can be used to specify ordering operations on the result of ``select``, and ``limit`` / ``offset`` can be used for pagination.

.. tabs::

  .. code-tab:: typescript

    e.select(e.Movie, (movie) => ({
      title: true,
      order_by: e.count(movie.actors),
      limit: 10,
      offset: 40
    }));

  .. code-tab:: edgeql

    select Movie {
      title
    }
    order by count(.actors)
    limit 10
    offset 40

The ``order_by`` key supports compound ordering with customizable directions and empty-handling policies.

.. code-block:: typescript

  e.select(e.Movie, (movie) => ({
    title: true,
    order_by: [
      {
        expression: e.count(movie.actors),
        direction: e.ASC,
        empty: e.EMPTY_LAST,
      },
      {
        expression: movie.title,
        direction: e.DESC,
      }
    ]
  }));

Updating objects
----------------

.. tabs::

  .. code-tab:: typescript

    e.update(e.Movie, (movie) => ({
      filter: e.op(movie.title, '=', 'Avengers: Infinity War - Part II'),
      set: {
        title: 'Avengers: Endgame',
      },
    }));

  .. code-tab:: edgeql

    update Movie
    filter .title = 'Avengers: Infinity War - Part II'
    set {
      title := 'Avengers: Endgame'
    }

Self-referential updates
^^^^^^^^^^^^^^^^^^^^^^^^

The query builder is particularly useful (or rather, ORMs are particularly bad) when setting properties to a modified version of their current value. For instance, this query would trim extra whitespace from all movie titles.

.. tabs::

  .. code-tab:: typescript

    e.update(e.Movie, (movie) => ({
      set: {
        title: e.str_trim(movie.title),
      },
    }));

  .. code-tab:: edgeql

    update Movie
    set {
      title := str_trim(.title)
    }

With an ORM, this is inexpressible; you'd need to write a script to iterate through all movies in your database.

Updating links
^^^^^^^^^^^^^^

When updating *links*, the query builder supports special syntax for *appending to* or *subtracting from* the set of linked objects.

.. tabs::

  .. code-tab:: typescript

    const actors = e.select(e.Person, person => ({
      filter: e.op(person.name, 'in', e.set('Benedict Cumberbatch', 'Rachel McAdams'))
    }));

    const query = e.update(e.Movie, (movie) => ({
      filter: e.op(movie.title, '=', "Doctor Strange"),
      set: {
        actors: {'+=': actors},
      }
    })).run(client);

  .. code-tab:: edgeql

    with actors := (
      select Person
      filter .name in {'Benedict Cumberbatch', 'Rachel McAdams'}
    )
    update Movie
    filter .title = "Doctor Strange"
    set {
      actors += actors
    }

Composing queries
-----------------

The previous ``update`` example also demonstrates one of the query builder's greatest strengths: *compositionality*. Because the *declaration* and *execution* of queries are two distinct steps, it's possible to declare *pieces* of a query separately, then put them all together later. Writing complex queries feels like writing a script.

For instance, we can compose multiple expressions to perform a nested insert + selection in one query.


.. tabs::

  .. code-tab:: typescript

    const rdj = e.insert(e.Person, {
      name: "Robert Downey Jr."
    });

    const ironMan = e.insert(e.Movie, {
      title: "Iron Man",
      release_year: 2008,
      actors: rdj
    });

    const query = e.select(ironMan, () => ({
      title: true,
      release_year: true,
      num_actors: e.count(ironMan.actors)
    }));

    const result = await query.run(client);
    // {title: string; release_year: number; num_actors: number}

  .. code-tab:: edgeql

    with
      rdj := (
        insert Person {
          name := "Robert Downey Jr."
        }
      ),
      ironMan := (
        insert Movie {
          title := "Iron Man",
          release_year := 2008
        }
      )
    select ironMan {
      title,
      release_year,
      num_actors := count(.actors)
    };

The query builder detects that ``newMovie`` occurs multiple times inside ``query`` and extracts it into a ``with`` block (AKA a "common table expression" in SQL parlance). Note that there's only one ``await``. We aren't *executing* ``rdj`` and ``ironMan``; they are subqueries that get composed into the final "superquery", which can be executed in a single round trip to the database.

Using query parameters
----------------------

As a final cherry on top, the query builder makes it painless to *parameterize* your queries. This lets you use external data (say, the body of an incoming ``POST`` request) in a typesafe way.

.. tabs::

  .. code-tab:: typescript

    const query = e.params(
      { title: e.str, release_year: e.int64 },
      ($) => {
        return e.insert(e.Movie, {
          title: $.title,
          release_year: $.release_year,
        });
      }
    );

    const result = await query.run(client, {
      title: 'Thor: Love and Thunder',
      release_year: 2022,
    });

  .. code-tab:: edgeql

    with
      title := <str>$title,
      release_year := <int64>$release_year
    insert Movie {
      title := title,
      release_year := release_year
    }

For a parameterized query, you pass the parameters as the second argument to ``.run()``; they are strongly typed and validated at runtime.

Comparison to ORMs
------------------

Hopefully it's clear from the examples above, but in terms of expressive power, the query builder is beyiond every ORM we're aware of. By and large, ORMs can only represent relatively basic read/write operations, whereas a proper query language can express much more:

- string modifications
- indexing and slicing of iterables
- aggregations
- math
- temporal logic
- coalescing and defaults (``??`` in JavaScript)
- conditionals (``a ? b : c`` in JavaScript)
- parameterization
- set logic like ``union`` or ``in``
- type logic and casting
- query compositionality (AKA common table expressions)
- computed properties
- :ref:`polymorphic queries <docs:ref_qb_polymorphism>`
- self-referential updates

This is to say nothing of schema modeling. EdgeDB supports yet more functionality lacking in most ORMs:

- computed properties—these are "virtual" properties corresponding to an EdgeQL that is dynamically executed whenever the property is fetched
- computed defaults
- complex constraint logic
- schema mixins (inheritance)
- link properties
- a full range of numerical types (``int{16,|32|64}``, ``float{32|64}``, ``bigint``, and ``decimal``)
- temporal types like ``duration`` and non-timezone-aware dates and times
- a database-native migration system including a planner and tracking system

Future directions
-----------------

The query builder has been available since the EdgeDB 1.0 release in February
2022, and is stable and production-ready. The query builder was recently
upgraded to support all EdgeDB 2.0 features, such as the ``e.group`` statement
and global schema variables. This post only covers a subset of the query
builder's full functionality; refer to the :ref:`Documentation
<docs:edgedb-js-qb>` for a more comprehensive look!

We're releasing EdgeDB 2.0 during a livestreamed launch event on July 28th,
2022. Join us there for some lightning talks about the biggest new features
and the first public demo of EdgeDB's new admin UI.
