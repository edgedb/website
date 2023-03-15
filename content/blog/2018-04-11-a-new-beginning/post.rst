.. blog:authors:: yury elvis
.. blog:published-on:: 2018-04-12 12:01 PM EST
.. blog:lead-image:: images/edge.jpg
.. blog:guid:: 6F94DFC8-713C-4B71-A7DD-71EFA9632D04
.. blog:description::
    In a few weeks we will release the first public technology preview
    of EdgeDB—a new open-source object-relational database. This post
    is a brief introduction and is the first in the series.


=======================
EdgeDB: A New Beginning
=======================

In a few weeks we will release the first public technology preview
of EdgeDB—a new open-source object-relational database.  This post
is a brief introduction and the first in the series.
Before diving in, let's take a look what motivated us to build EdgeDB.


Motivation
==========

Databases have always been and will always be the defining piece
of any technological stack.  In the last decade there has been a lot
of activity and interesting developments in the field.  Just 10 years
ago there was no MongoDB, no affordable cloud databases, and even cloud
itself was a relatively new concept.  Today there is an abundance
of database solutions using non-relational data models with a promise
to make working with data scalable and developer-friendly.

The latter part of this promise turned out to be elusive.  Document
NoSQL databases make the initial schemaless prototyping stage easy,
but tend to increase technical debt over time.  Maintaining overall
data and schema consistency, as well as performing complex analytics on
schemaless data is much harder than it is with traditional RDBMS.

At the end of the day, if one is choosing a database solution for
their new project, chances are they will pick a relational database.
Predictable performance, powerful query language, and
consistency guarantees are all the reasons RDBMS dominate the market
and are largely unchallenged.

However, relational databases are built on a model that is decades old
and which becomes increasingly inadequate for the rapidly transforming
software development field.  Certainly, PostgreSQL is being constantly
improved with features like advanced JSON support, query parallelization,
and a JIT compiler to boost the performance of complex queries even
further.  However, the way applications interface with a relational
database did not change meaningfully.  We still use slow ORMs,
struggle with schema migrations and write poor ad-hoc SQL queries.


Object-Relational
=================

Most software engineers don't think in tables. Our programming
languages are built around higher-level abstractions like types
and objects. If you have two objects ``A`` and ``B`` and want to
reference one from another, you would just write ``A.b = B``.
To do the same in a relational database, you would need to deal
with foreign keys, joins, and sometimes intermediate tables,
essentially working directly at a much lower level of abstraction.

This inconsistency between relational databases and modern
programming languages has been known for a while, and even has
a name: *object-relational impedance mismatch*.  It is the reason
why ORMs are so popular and why there is so much interest around
technologies like GraphQL.

The problem with these solutions is that they attempt to bridge
the gap from the *application* side, and either sacrifice the expressive
power of the underlying database, or implement an overly complex mapping
which largely defeats the purpose.

While the industry seems to be obsessed with solving the problems
of scale, there are no serious attempts to `solve the object-relational
mismatch </blog/a-solution-to-the-sql-vs-orm-dilemma>`_ on the *database* side.


EdgeDB
======

EdgeDB is the next generation *object-relational database*.  Instead of
the relational model it implements an *object graph model*.  In this model,
data is described and stored as strongly typed objects and relationships,
or *links* between them.  Objects and links can hold *properties*: a set
of named scalar values.

.. note::
    :class: aside

    This model is sometimes called a *property graph* model.

EdgeDB is not a graph database: the data is stored and queried using
relational database techniques and requires a strict schema.

EdgeDB is not a document database, but inserting, modifying and querying
hierarchical document-like data is trivial.

EdgeDB is not a traditional object database.  Despite the word "object" in
"object-relational", it is not an implementation of OOP persistence or
encapsulation.

It features an expressive query language—EdgeQL—with a goal to match and
surpass modern SQL capabilities like subqueries, advanced aggregation,
and window functions.

EdgeDB is based on PostgreSQL, and inherits all of its strengths: reliability,
ACID compliance, and performance.


An Example
==========

Just to give a small taste of EdgeDB, let's define a simple schema describing
a rudimentary GitHub-like app using our schema DSL:

.. code-block:: sdl

    # Define a string enumerated type for
    # pull request status.
    scalar type pr_status extending str {
      constraint one_of('Open', 'Closed', 'Merged')
    }

    # Pull request object type definition.
    type PullRequest {
      required property title -> str;

      required property status -> pr_status {
        default := 'Open';
      }

      # Pull request "author" as a to-one
      # link to a User object.
      required link author -> User;

      # Many-to-many relationship with
      # different User objects.
      multi link assignees -> User;
    }

    type User {
      required property name -> str;

      multi link followees -> User;
    }


Now let's see what a simple query in EdgeQL looks like:

.. code-block:: edgeql

    SELECT User {
      id,
      name,
      followees: {
        id,
        name
      }
    }
    FILTER
      User.name = 'Alice';

The query will return a list of all users with the name "Alice" together
with all users she follows.  The data can be returned as rich objects
in the client programming language or as JSON.

Here's how a comparable SQL query might look like:

.. code-block:: sql

    SELECT
      users.id,
      users.name,
      array_agg(followees.id) AS followee_ids,
      array_agg(followees.name) AS followee_names

    FROM
      users
      LEFT JOIN user_followees ON
        user_followees.user_id = users.id
      LEFT JOIN users AS followees ON
        followees.id = user_followees.followee_id

    WHERE
      users.name = 'Alice'

    GROUP BY
      users.id, users.name;

Note that this SQL query is not very efficient. An experienced
developer would rewrite it to use subqueries. Besides, to get the
result of the query as JSON it would require even more effort.

Below is an example of a slightly more advanced EdgeQL query that shows
*aggregation* and *backward link navigation*.

.. code-block:: edgeql

    SELECT User {
      name,

      # Count the number of users who follow this user
      # by traversing the "followees" link *backwards*,
      # as denoted by '.<'
      followed_by_count := count(User.<followees),

      # Count the number of users that this user is
      # following by traversing the "followees" link
      # *forwards*, as denoted by '.>' or simply '.'
      follow_count := count(User.followees),

      # Get a set of open pull requests that this
      # user is the assignee of.
      open_prs := User.<assignee[IS PullRequest] {
        title
      } FILTER .status = 'Open'
    };

Example JSON output:

.. code-block:: json

    [
      {
        "name": "Alice",
        "followed_by_count": 101,
        "follow_count": 45,
        "open_prs": [
          {
            "title": "Implement support for window functions."
          },
          ...
        ]
      },
      ...
    ]


What's Next
===========

There are a multitude of unique EdgeDB features that we are eager
to talk about. Here's a brief outline of topics we will cover in
the following blog posts:

* **Data model and introspection**

  A look at EdgeDB type system, schema composition and introspection.

* **EdgeQL**

  An introduction into EdgeQL and how it's different from SQL and other
  query languages.

* **Polymorphism**

  An overview of how EdgeDB implements type composition, abstract
  data types, and polymorphic queries.

* **Schema Migrations**

  A discussion on schema migrations and how EdgeDB implements
  them natively.

* **GraphQL**

  A review of GraphQL support in EdgeDB.


Meanwhile, check out our `website <https://www.edgedb.com>`_,
follow `@edgedatabase <http://twitter.com/edgedatabase>`_ on Twitter,
and stay tuned for the updates!
