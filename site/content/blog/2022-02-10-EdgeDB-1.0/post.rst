.. blog:authors:: yury elvis
.. blog:published-on:: 2022-02-10 11:00 AM PT
.. blog:lead-image:: images/v1_nova.jpg
.. blog:guid:: 725602ee-853c-11ec-bf29-33136fdaba51
.. blog:description::
    Today, after years of research, development, and
    refinement EdgeDB graduates to a production-ready
    database. We are very proud to announce EdgeDB 1.0.


==========
EdgeDB 1.0
==========


.. note::

  Check out the discussion of this post on
  `Hacker News <https://news.ycombinator.com/item?id=30290225>`_.
  See the recording of the live launch event on
  `YouTube <https://www.youtube.com/watch?v=WRZ3o-NsU_4>`_.

Today, after several years of building (and a long list of prereleases) we are
extremely proud to announce the release of EdgeDB 1.0, the first open source,
graph-relational database! 🎊

A brief Q&A is in order.

*What are the killer features?*

* Modern, lean query language designed to surpass SQL in expressive power;
* Rich type system;
* A declarative schema which lets you express inheritance, computed properties,
  functions, complex constraints (and, in the near future, access control
  rules);
* A builtin migration system that can reason and diff schemas automatically
  or interactively;
* Powered by PostgreSQL.

*What is a graph-relational database?*

EdgeDB is built on an *extension* of the relational data model that we call
the *graph-relational model*.  This model completely eliminates the
object-relational impedance mismatch while retaining the solid basis of
and performance of the classic relational model.  This makes EdgeDB an
ideal database for application development.

*Why do we need a new kind of database?*

The developer experience of using the existing databases is not good enough
anymore.  We should not continue wasting our productivity with a database
API architecture from the last century.  There has been *amazing* progress
in database backend implementations in the last two decades, but it absolutely
languishes behind an interface that was designed in an era of mainframes.
We want to fix this and move the database API and developer experience into the
era of modern application development.

*How does it work?*

EdgeDB reimplements the entire database frontend: the protocol, the query
language, schema definition, client libraries and tools.  The backend is
PostgreSQL, but EdgeDB will run it for you, and you don't have to know
it's even there.


We shall do better than SQL
===========================

A lot of words have already been written on the inadequacies of SQL, both
by `us <better_sql_>`_ and `others <against_sql_>`_.  Let's just say that
we can and *must* try to do better to move forward as the industry.  EdgeQL
is an attempt to do just that.  We are not pretending that it's an easy thing
to do.  It's an enormous undertaking.  In some sense, building a new SQL
database from scratch is a safer bet than recasting PostgreSQL with a new data
model and a new query language.  However, we are already starting to see this
bet paying off with overwhelmingly positive feedback from early users of
EdgeQL, as well as our better-than-expected experience of embedding EdgeQL
natively into TypeScript.

If you are not familiar with EdgeQL yet, here's the executive summary:

* built on graph-relational model: data relationships are a
  first class concept, no verbose joins necessary;

* inherently composable: everything is an expression and there is only
  one class of values;

* supports straightforward navigation and manipulation of non-trivial
  graphs of data.

Because a picture is worth a thousand words, let's look at an example query.

**Task**: get a set of movies where Zendaya played a role, and for every
such movie calculate the average review score, and also retrieve the list
of top 5 actors in the order of credits.

Here's how such query can be written in EdgeQL:

.. code-block:: edgeql

   select
     Movie {
       title,
       rating := math::mean(.ratings.score)
       actors: {
         name
       } order by @credits_order
         limit 5,
     }
   filter
     "Zendaya" in .actors.name

And here's a standard SQL formulation:

.. code-block:: sql

   SELECT
     title,
     Actors.name AS actor_name,
     (SELECT avg(score)
      FROM Movie_Reviews
      WHERE movie_id = Movie.id) AS rating
   FROM
     Movie
     CROSS JOIN LATERAL (
       SELECT name
       FROM
         Movie_Actors
         INNER JOIN Person
           ON Movie_Actors.person_id = Person.id
         WHERE Movie_Actors.movie_id = Movie.id
         ORDER BY Movie_Actors.credits_order
         FETCH FIRST 5 ROWS ONLY
      ) AS Actors
   WHERE
     'Zendaya' IN (
       SELECT Person.name
       FROM
         Movie_Actors
         INNER JOIN Person
           ON Movie_Actors.person_id = Person.id
       WHERE
         Movie_Actors.movie_id = Movie.id
     )

The queries aren't exactly equivalent as the SQL query doesn't actually
select actors as a nested collection, but we're willing to overlook that here.
The difference in query text size is striking, and that's just one level of
nesting.


The *true* source of truth
==========================

Applications today are no longer monoliths operating on a single machine.
Instead, they are deployed onto vast swarms of network nodes as services,
APIs, and serverless functions.  All those components need to coordinate
and agree on what is true and what isn't, which state is valid and which
isn't, and, importantly, who gets access to what.  In other words, it's best
to have some common, consistent source of truth about the state of the
overall system under concurrent load.  Database servers are very good at that,
but only if yours and database's view on what's "correct" align well.

The last point, of course, is what this is all about: if you communicate your
model and your data invariants to the database properly and keep it that way,
the database will happily solve the majority of your data correctness and
data security problems.


Not just a database server
==========================

Our mission to provide developers with awesome database superpowers does not
stop with the database server.

We understand that even the best database implementation can be hopelessly
hobbled by a bad database client.  This is why we wrote (and will continue
writing) full-featured first-party database client implementations for common
programming languages (currently available for Python,
JavaScript/TypeScript/Deno, and Go).  Alas, it's impossible to write a
client for *every* language at once, so we provide exhaustive documentation for
client implementers, as well as common conformance test suites.

Although a lot more pleasant than SQL, writing EdgeQL queries as strings in
code is not an optimal experience.  Fortunately, EdgeQL is designed to be
an easy *compilation target* and thus our goal is to provide no-compromise
way of expressing EdgeQL queries using the syntax and idioms of your
programming language.  Alongside EdgeDB 1.0 today we announce the native
JavaScript/TypeScript query builder.

Here's the movie query from earlier expressed in pure TypeScript:

.. code-block:: typescript

   e.select(
     e.Movie, (movie) => ({
       title: true,
       rating: e.math.mean(movie.reviews.score),
       actors: (actor) => ({
         name: true,
         order_by: actor["@credits_order"],
         limit: 5,
       }),
       filter: e.op("Zendaya", "in", movie.actors.name)
     })
   )

Remarkably, it follows the original EdgeQL query structure and is almost
the same size.  In return you get a fully typechecked query backend by
type definitions autogenerated by introspecting your schema.  We are very
happy how this turned out, and it's proof that EdgeQL integrates into modern
languages well, further reducing cognitive overhead.

Last but not least is our comprehensive CLI, which goes far beyond a REPL and
traditional database client commands, and includes commands to easily install
and manage local database instances (and, soon, managed cloud instances),
interactively create and apply database migrations, and much more.


Cloud-ready database APIs
=========================

The vast scale of modern application deployments requires that inelastic
computing resources are managed *very* carefully.  Until cloud-native databases
reach complete functional and performance parity with traditional databases,
we will have to contend with the fact that the database is a scarce resource.
Unfortunately, traditional RDBMS make this job much harder due to two factors:

* legacy client/server protocols require unnecessary server roundtrips
  due to being too chatty or too dumb,

* SQL is very bad at fetching and updating linked data, so multiple
  sequential queries are frequently needed, ORMs sometimes make this worse.

What the above means is that even simple operations frequently require multiple
slow trips over the network while the database server is potentially holding
onto precious connection slots or data locks, reducing the availability of
the entire system.

With the knowledge of the above, EdgeDB comes prepared.  EdgeQL allows
combining a practically arbitrary number of fetching or *mutating* operations
into a single query. Our client/server protocol is designed to minimize the
number of server roundtrips: commonly only one request/response event is
needed.

EdgeDB provides serializable transaction isolation, and, because it's the only
way to correctly interact with the database concurrently, it's the only option.
Serializable isolation means that the server will sometimes refuse to accept
your transaction and will ask you to retry it.  Another (less common) condition
is when the server connection suddenly drops mid-transaction either due to
failover or network flakiness.  All those conditions are completely recoverable
and normal in a distributed environment, and so all EdgeDB client bindings
have APIs that are designed to perform automatic transaction retries.


Future
======

The 1.0 release is a major milestone for us. We now have a stable
foundation to continue our quest of building a true next generation
database!  In other words, it's just the beginning.



We plan to adopt a faster release cycle,
with EdgeDB 2.0 targeted in just a few months.  We are working on
a cloud service with some ambitious features that will go well beyond
just giving you an IP address to connect to.

Buckle up, we are going to have one hell of a ride!

We'd like to thank our community of early adopters who helped us with
feedback, early testing, and provided the much needed encouragement.
Join us on GitHub, give us a star, but most importantly check out EdgeDB!

**We can't wait to see what you build with EdgeDB! ❤️**

.. _better_sql: https://www.edgedb.com/blog/we-can-do-better-than-sql
.. _against_sql: https://www.scattered-thoughts.net/writing/against-sql/
