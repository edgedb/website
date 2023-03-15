.. blog:authors:: ambv
.. blog:published-on:: 2020-08-27 01:00 PM PT
.. blog:lead-image:: images/alpha5.jpg
.. blog:guid:: e9e14dd8-e730-11ea-bbbc-acde48001122
.. blog:description::
    EdgeDB 1.0 Alpha 5 "Luhman" has been released with a score of
    user-requested improvements.



===========================
EdgeDB 1.0 Alpha 5 "Luhman"
===========================

After another six weeks of work since `the previous release <alpha4_>`_, we
have another alpha release for you.  Sticking to our near star naming scheme,
this one's called EdgeDB 1.0 Alpha 5 "Luhman".  You can `download
<download_>`_ it in a number of ways or try it out in our `interactive
tutorial <tutorial_>`_ without the need to install anything.

.. note::
    :class: aside-nobg

    :blog:github-button:`href:https://github.com/edgedb/edgedb|size:large|title:EdgeDB`

There's some important improvements requested by our users in this release,
as well as another round of changes designed to make database administration
easier. Let's take a look at what's in store!

.. rubric:: What's EdgeDB

EdgeDB is an advanced `open source <github_>`_ relational database based on
PostgreSQL.  The project aims to give developers and data engineers a highly
efficient and productive database technology while addressing the
`shortcomings of SQL <bettersql_>`_ and its surrounding ecosystem:

* high-level data model and type system;
* a powerful, expressive and extensible query language that allows working
  with complex data relationships easily;
* first-class support for schema migrations;
* support for converting arbitrary strictly typed data to and from JSON
  via a simple cast operator;
* out-of-the-box interoperability via REST and GraphQL.


Simplified Administration with Named Instances
----------------------------------------------

When you install a given version of EdgeDB, what you're getting is
a database cluster which can hold multiple logical databases with
independent schemas within the same operating system-level service.

Connecting into one of those database instances traditionally required you to
store the credentials to it and pass them explicitly to the database client,
for example in the form of a Data Source Name (DSN) string.

We think there's a better way.  Just as the SSH client stores your keys
in ``~/.ssh/``, and the AWS CLI stores its credentials in
``~/.aws/credentials``, the EdgeDB CLI now can store your credentials
in ``~/.edgedb/credentials/<instance-name>.json``.

.. note::
    :class: aside

    **Note:** Since beta 3, EdgeDB has changed where it stores credentials and
    other files. Run ``edgedb info`` to find where these files are stored on
    your system.

Those get written automatically during database instance setup with
``edgedb instance init``.  Better yet, you can then connect to such an instance
just by passing its name instead of a full DSN to the EdgeDB client, like:

.. note::
    :class: aside

    **Note:** In the latest bindings these API's have been simplified into a
    single ``create_client()`` API. See the :ref:`RC2 blog post <ref_rc2_pool>`
    for details.

.. code-block:: python

   import edgedb
   conn = edgedb.connect('my_instance')
   conn = await edgedb.async_connect('my_instance')
   pool = await edgedb.create_async_pool('my_instance')

Listing all local instances can be done by a simple call to
``edgedb server status --all``.

We believe such quality-of-life improvements will make day-to-day operations
easier as well as more secure.


"Upserts"
---------

There's a popular database interaction where the client needs to either
insert a new object or update an existing one identified with some key.
Those operations are affectionately called "upserts".  There are also
analogical variants where the user wants to either select existing data
or insert new data if none were present.

Traditional databases and popular ORMs provide limited support for
performing such operations atomically, efficiently, and ergonomically.
This was another area where we thought we can do better, and so with
this release we're introducing the ``INSERT ... UNLESS CONFLICT ... ELSE``
operation.  You'd use it like this:

.. code-block:: edgeql

   WITH MODULE people
   SELECT (
       INSERT Person { name := "Łukasz Langa", is_admin := true }
       UNLESS CONFLICT ON .name
       ELSE (UPDATE Person SET { is_admin := true })
   ) { name, is_admin };

To express a *get-or-create* variant, you would use a ``SELECT`` in the
``ELSE`` clause.  In the example below we do it to get or create a ``Person``
object representing a famous director.  Let's make it even more interesting,
showing how you can compose EdgeQL queries to use the result of our query
right away to link the director with a newly created ``Movie`` object.

.. code-block:: edgeql

   INSERT Movie {
     title := 'Bladerunner 2049',
     director := (
       INSERT Person {
         name := 'Denis Villeneuve'
       }
       UNLESS CONFLICT ON .name
       ELSE (SELECT Person)
     )
   }

This complex operation is performed entirely within the database, saving
on network roundtrips and needless serialization.  And yet, it reads well.
Looking at the query above, imagine what you would have to change to make
the outer insert also become a *get-or-create* on the movie title.

This composability and regularity is at the heart of what makes EdgeQL
`better than SQL <bettersql_>`_.

Type-level constraints
----------------------

Moving parts of the business logic to the database level can help maintain
data integrity.  One popular example of this is specifying custom
constraints on object properties, for example requiring that a given
field matches a particular regular expression or is unique.

This time around we go one step further, allowing constraints on entire
types.  This allows expressing constraints which need multiple properties
to compute, for example:

.. code-block:: sdl

    type SmallMagnitudeVector {
        required property x -> float64;
        required property y -> float64;
        constraint expression on (
            (.x^2 + .y^2) < 25
        );
    }


Support for casts from JSON to array and tuple types
----------------------------------------------------

Previously, only primitive JSON values could be cast to EdgeQL scalar types.
In this release, we've added support for array and tuple casts of arbitrary
complexity:

.. code-block:: edgeql-repl

    db> WITH
    ...    data := <tuple<
    ...      first_name: str,
    ...      last_name: str,
    ...      interests: array<str>,
    ...    >><json>$input
    ... INSERT User {
    ...   first_name := data.first_name,
    ...   last_name := data.last_name,
    ...   interests := (
    ...     SELECT
    ...       Interest
    ...     FILTER
    ...       .label IN array_unpack(data.interests)
    ...   )
    ... }
    Parameter <json>$input:
    {
      "first_name": "Phil",
      "last_name": "Emarg",
      "interests": ["fishing", "skiing"]
    }


Transaction Blocks in the JavaScript Client
-------------------------------------------

We have added an API to run code in a transaction block to our
JavaScript client:

.. code-block:: javascript

   const conn = await edgedb.connect('my-app');

   await con.transaction(async (tx) => {
     // A complex interaction with the DB. The queries will
     // be executed in one transaction block.
     await tx.execute('INSERT ...');
     await tx.execute('SELECT ...');

     // Transactions can be nested:
     await tx.transaction(async (innerTx) => {
       const data = await innerTx.execute('SELECT ...');
       await innerTx.execute('INSERT ...', [data]);
     });
   });

  await conn.close();

The block accepts multiple statements and will properly abort
transactions and roll back on errors.  For example:

.. code-block:: javascript

   async function faulty(conn) {
     await conn.transaction(async (tx) => {
       await tx.execute(`
         INSERT Event {
           name := 'TXTEST'
         };
       `);
       await tx.execute("SELECT 1 / 0;");
     });
   }

In this case the division by zero error pushes the transaction into an
invalid state.  Not only will the block throw a ``DivisionByZeroError`` but
also the ``INSERT`` of an ``Event`` with the name ``"TXTEST"`` will be
rolled back.


GraphQL improvements
--------------------

Native support for GraphQL is definitely handy.  We improved it by
allowing multiple mutations in a single mutation query, as well as
enabled sorting on non-trivial paths, reflecting nested aliased types,
and added an ``exists`` filter operation.

Imagine that you want to use the GraphQL API to find movie records
that are somewhat incomplete, say they are missing ``director``
information. With ``exists`` filter this becomes as simple as:

.. code-block:: graphql

    {
      Movie(
        filter: {
          director: {
            exists: false
          }
        }
      ) {
        id
        title
      }
    }


Stored Migrations Are Coming
----------------------------

Last time around we introduced the back-end implementation of the new,
much improved workflow for migrations.  This time around we're providing
an initial CLI for this new functionality:

* ``edgedb migration create`` allows creating migration scripts; and

* ``edgedb migrate`` allows bringing the current database to a specified
  migration revision (latest by default).

We think this set of features will be an important foundation of successful
EdgeDB adoption.  We'll spend more time on this topic next time around.
You can read more about migrations in the relevant `open RFC document
<migrations_>`_.


Summary
-------

As usual, the :ref:`change log <docs:ref_changelog_alpha5>` provides a detailed
story of the changes in this release.

If you have any questions, feel free to join the conversation `on GitHub
Discussions <discussions_>`_, or ask in form of `a bug report or a feature
request <github_>`_.

If you'd like to learn more about our tech stack, we recently started `a
YouTube channel <youtube_>`_.  At the moment we're running a series
introducing Python's ``asyncio``.  We're up to five released episodes
with the sixth just around the corner.

For future announcements, you can `find us on Twitter <twitter_>`_.


.. _alpha4: /blog/edgedb-1-0-alpha-4-barnard-s-star
.. _download: /download
.. _github: https://github.com/edgedb/edgedb
.. _tutorial: https://www.edgedb.com/tutorial
.. _twitter: https://twitter.com/edgedatabase
.. _youtube: https://www.youtube.com/c/EdgeDB
.. _bettersql: /blog/we-can-do-better-than-sql
.. _rustup: https://rustup.rs/
.. _migrations: https://github.com/edgedb/rfcs/blob/master/text/1000-migrations.rst
.. _edbserver: https://github.com/edgedb/rfcs/blob/master/text/1001-edgedb-server-control.rst
.. _edgedbjs: https://github.com/edgedb/edgedb-js/
.. _query: https://github.com/edgedb/edgedb-python/issues/51
.. _discussions: https://github.com/orgs/edgedb/discussions
