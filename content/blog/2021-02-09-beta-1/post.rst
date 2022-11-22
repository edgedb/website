.. blog:authors:: ambv victor
.. blog:published-on:: 2021-02-25 03:00 PM PT
.. blog:lead-image:: images/beta1.jpg
.. blog:guid:: 2e7f078c-64a9-11eb-8cf6-acde48001122
.. blog:description::
    EdgeDB, the next-generation relational database, reached a major
    milestone.  Version 1.0 Beta 1 "Sirius" is now available and is ready
    for early adoption.


==========================
EdgeDB 1.0 Beta 1 "Sirius"
==========================

Nearly two years after releasing 1.0 Alpha 1, and after seven alpha releases,
we are ready to bring EdgeDB to the public beta phase!

This means that as of now, we will make every effort to keep the public-facing
APIs backwards compatible.  This includes EdgeQL, our standard library,
schema definition language, official database clients' APIs, even CLI
commands and their options.  Most importantly, EdgeDB's dumps made today
will be restorable in future versions of the database.

This release completes a set of features we feel are crucial for
a well-rounded 1.0 product, and we invite early adopters to try it out.
On our end, we're spending the next few months on getting EdgeDB ready
for the first stable release.  Entering Beta means we won't be adding
new features until the release of 1.0 final.

You can `download <download_>`_ 1.0b1 in a number of ways or try it out
in our `interactive tutorial <tutorial_>`_ without the need to install
anything.


.. note::
    :class: aside-nobg

    :blog:github-button:`href:https://github.com/edgedb/edgedb|size:large|title:EdgeDB`

.. rubric:: What's EdgeDB

EdgeDB is an advanced `open source <github_>`_ relational database built
on top of PostgreSQL which aims to `change the game <tenex_>`_ in terms
of data layer usability and performance.

It combines an expressive object-oriented data model with a composable
query language based on set logic, making complex data schemas easy to
express, populate, and query.  The query system's explicit goal is to
address `shortcomings of SQL <bettersql_>`_.

As a database designed for the long haul, EdgeDB allows for your data
to evolve along with changing business needs, by providing built-in
support for schema migrations. It's also developed in the open and
under the permissive Apache license.

EdgeDB's performance focus is embodied in its carefully designed
first-party database clients (currently available for JavaScript, Go,
and Python.)  The database server itself compiles EdgeQL queries to
efficient SQL in ways that outperform many manually written queries.

As a modern database, EdgeDB also provides interoperability with your
other services via built-in support for GraphQL, REST, and easy
:js:meth:`casting from and to JSON <docs:Client.queryJSON>` while keeping
your data strictly typed.


Built-in database migrations in use
-----------------------------------

We believe that managing the evolution of your data models is a crucial
feature in a modern database product.  The alternatives would be either
weakly typed schemas or a third-party product.  We're not satisfied with
either.  The former unnecessarily moves some of the responsibilities of
the database into your application code, making data consistency harder
and development more error-prone.  The latter on the other hand usually
ties you to a particular database connection framework in a particular
programming language, putting that language in a privileged position.
This is suboptimal in today's environment where very often mobile
applications are written in multiple programming languages, a Web
front-end can be another, and back-end processing using yet another.

With Beta 1, the migrations functionality we envisioned for EdgeDB
is fully realized.  While you could :ref:`start, populate, and commit
migrations <docs:ref_eql_ddl_migrations>` from EdgeQL directly for a few
releases already, now you can fully manage migrations from the CLI, making the
workflow even more high-level.

The idea here is to be able to version your schema alongside your
source code, possibly as a separate repository that you can link
as a submodule in multiple applications that your system consists of.
That repository would hold schema files describing migrations between
different states of your data model.

As an example, let's say we start with the following schema for a simple
chat app:

.. code-block:: sdl

    module default {
        type User {
            required property name -> str;
            required property email -> str;
            required property password_hash -> str;
        }

        type Message {
            required link author -> User;
            required property body -> str;
            required property timestamp -> datetime {
                default := datetime_current()
            }
        }
    };

The migration CLI looks for ``.esdl`` files in the ``dbschema`` directory
by default, so let's create one and write the above into a
``dbschema/default.esdl`` file inside it.  Let's
:ref:`install <docs:ref_quickstart_install>` EdgeDB server and then create a
new database instance for our chat app:

::

    $ edgedb instance init chatapp

Now, we can create the initial migration to the schema we've written above::

    $ edgedb -I chatapp migration create
    did you create object type 'default::User'? [y,n,l,c,b,s,q,?]

This is new, what do all those possible actions mean?  Let's find out:

::

    ?

    y - confirm the prompt, use the DDL statements
    n - reject the prompt
    l - list the DDL statements associated with prompt
    c - list already confirmed EdgeQL statements
    b - revert back to previous save point, perhaps previous question
    s - stop and save changes (splits migration into multiple)
    q - quit without saving changes
    h or ? - print help
    did you create object type 'default::User'? [y,n,l,c,b,s,q,?]

That's clear, we did in fact create ``User``. Let's confirm:

::

    y
    did you create object type 'default::Message'? [y,n,l,c,b,s,q,?]
    y
    Created dbschema/migrations/00001.edgeql, id:
    m1ufwaxcqiwcq3ttcujnxv6f3jewhfrywc442z6gjk3sm3e5fgyr4q

This creates the first migration file
``dbschema/migrations/00001.edgeql``. After reviewing it to make
sure everything is in order, we can apply the migration with the
following command:

::

    $ edgedb -I chatapp migrate
    Applied m1ufwaxcqiwcq3ttcujnxv6f3jewhfrywc442z6gjk3sm3e5fgyr4q
    (00001.edgeql)

In the course of implementing our app we decide to add more features,
such as a friends list and multiple chat channels, so we alter our
schema to be:

.. code-block:: sdl

    module default {
        type User {
            required property name -> str;
            required property email -> str;
            required property password_hash -> str;

            multi link friends -> User;
        }

        type Message {
            required link author -> User;
            required property body -> str;
            required property timestamp -> datetime {
                default := datetime_current()
            }

            link channel -> Channel;
        }

        type Channel {
            required property title -> str {
                constraint exclusive;
            };
            property description -> str;
        }
    };

And we apply the changes by using ``migration create`` and ``migrate``
commands again:

::

    $ edgedb -I chatapp migration create
    did you create object type 'default::Channel'? [y,n,l,c,b,s,q,?]
    y
    did you create link 'channel' of object type 'default::Message'?
    [y,n,l,c,b,s,q,?]
    y
    did you create link 'friends' of object type 'default::User'?
    [y,n,l,c,b,s,q,?]
    y
    Created dbschema/migrations/00002.edgeql, id:
    m1kebitqygj3o75wvrnicnpwthinqsofb6hnpbnr7vrtjfynqelmzq
    $ edgedb -I chatapp migrate
    Applied m1kebitqygj3o75wvrnicnpwthinqsofb6hnpbnr7vrtjfynqelmzq
    (00002.edgeql)

At this point we may want to actually create a default channel "Main"
and make the ``channel`` link required. So we alter the schema to make
the link required and run ``edgedb migration create`` again:

::

    $ edgedb -I chatapp migration create
    did you make link 'channel' of object type 'default::Message'
    required? [y,n,l,c,b,s,q,?]

Indeed we did but for the sake of curiosity let's list the DDL that
the tool is producing for us here:

::

    l

    Following DDL statements will be applied:
    ALTER TYPE default::Message {
        ALTER LINK channel {
            SET REQUIRED USING (\(fill_expr));
        };
    };

Interestingly the DDL statement specifies that some expression will
have to be provided to backfill data in the database.  Let's see how
it deals with this:

::

    did you make link 'channel' of object type 'default::Message'
    required? [y,n,l,c,b,s,q,?]
    y
    Please specify an expression to populate existing objects in
    order to make link 'channel' required:
    fill_expr> SELECT Channel FILTER .title = 'Main'
    Created dbschema/migrations/00003.edgeql, id:
    m1wk64aoerkmvbdlurcxjxgbgv6c3xmuo3uz7pxc3gauyx4muysg6q

However, before applying this migration we also add the line ``INSERT
default::Channel {title := 'Main'};`` at the beginning of the
migration block in the ``dbschema/migrations/00003.edgeql`` file
to ensure the ``SELECT`` above finds the default channel.
Now we can actually apply the changes:

::

    $ edgedb -I chatapp migrate
    edgedb error: could not read migrations in dbschema/migrations:
    could not read migration file dbschema/migrations/00003.edgeql:
    migration name should be
    `m1fckqi5wqjtgynu77ummambcid3c2xp7wq4piadh5glbxcyxrkkba` but
    `m1wk64aoerkmvbdlurcxjxgbgv6c3xmuo3uz7pxc3gauyx4muysg6q` is used
    instead.
    Migration names are computed from the hash of the migration
    contents. To proceed you must fix the statement to read as:
      CREATE MIGRATION
      m1fckqi5wqjtgynu77ummambcid3c2xp7wq4piadh5glbxcyxrkkba ONTO ...
    if this migration is not applied to any database. Alternatively,
    revert the changes to the file.

Uh-oh! The migration failed, but the error message actually explains
what happened: the tool discovered we made manual changes to the file.
Since this is deliberate, we just need to adjust the migration hash in
order to proceed.  The tool even supplies us with the new hash. After
adjusting the migration file, we can now apply it:

::

    $ edgedb -I chatapp migrate
    Applied m1fckqi5wqjtgynu77ummambcid3c2xp7wq4piadh5glbxcyxrkkba
    (00003.edgeql)

So let's make a minor tweak by renaming the ``friends`` link into
``circle``. After updating our ``dbschema/default.esdl`` file we can
apply the changes:

::

    $ edgedb -I chatapp migration create
    did you rename link 'friends' of object type 'default::User' to
    'circle'? [y,n,l,c,b,s,q,?]
    y
    Created dbschema/migrations/00004.edgeql, id:
    m1zl4xyherdjfgdefciyvs4sgb4kayfb3exkmp6fgjsxisfa5eeapq

    $ edgedb -I chatapp migrate
    Applied m1zl4xyherdjfgdefciyvs4sgb4kayfb3exkmp6fgjsxisfa5eeapq
    (00004.edgeql)

You might be wondering why the tool explicitly confirms each action with
you instead of simply creating the DDL statements for you.  The answer
is two-fold.  First off, not all changes between two declarative schemas
can be unequivocally translated into DDL statements.  And additionally,
as you've seen already, some migrations require data to be created,
mutated, or deleted, sometimes in-between DDL statements.

To demonstrate this challenge, let's imagine we decided to abstract
away the concept of a name and replace the string with a full-blown
object that looks like this:

.. code-block:: sdl

    type Name {
        required property first -> str;
        property middle -> str;
        required property last -> str;
    }

With this type in place, we replace the ``required property name -> str``
with ``required link name -> Name`` and run ``migration create``:

::

    $ edgedb -I chatapp migration create
    did you create object type 'default::Name'?
    [y,n,l,c,b,s,q,?]
    y
    did you drop property 'name' of object type 'default::User'?
    [y,n,l,c,b,s,q,?]
    n
    did you drop property 'name' of object type 'default::User'?
    [y,n,l,c,b,s,q,?]

Oh, the tool cannot continue without dropping the property but this is
not what we want.  We need to migrate data somehow from the generic
string to our new model.  Sometimes this might suggest you that the
change isn't so good after all (which `it admittedly isn't in this case
<name_falsehoods_>`_!), or it at least points at the fact that we do
need to take some additional care migrating data as well.  What did we
confirm with the tool so far?

::

    c

    Following EdgeQL statements were confirmed:
        CREATE TYPE default::Name {
            CREATE REQUIRED PROPERTY first -> std::str;
            CREATE REQUIRED PROPERTY last -> std::str;
            CREATE PROPERTY middle -> std::str;
        };
    did you drop property 'name' of object type 'default::User'?
    [y,n,l,c,b,s,q,?]

At this point the wisest course of action is accept the new ``Name``
type and create the migration as is:

::

    s

    Created ./migrations/00005.edgeql, id:
    m14akrp2ta25vputun2gbnykqnmj4xuqqwrablfefdq5rwbdlsllyq

Now we can create new ``Name`` objects based on the current names and
migrate later, before we unceremoniously drop the old property.

The above example shows some of the interactions with the EdgeDB
migration management tools. We will keep improving the inference
engine that guides the prompts of ``migration create``. However, if
the suggestion engine fails to provide a perfect fit, the option of
adjusting the migration file is always available.

To read more about how we designed migrations in EdgeDB, go read
our open `RFC 1000 <migrations_rfc_>`_ where this functionality was
first discussed.  User-facing documentation is available :ref:`in our docs
<docs:ref_eql_ddl_migrations>`.


Always-on database connections with safe automatic retries
----------------------------------------------------------

Distributed systems with non-trivial networking topologies are bound to
experience failure modes like disconnections, bandwidth bottlenecks or
write contention.  We decided that robust handling of those occasional but
problematic events should be a built-in feature of our first-party database
client bindings.

The most important piece of the puzzle here is making sure transactions
are dealt with properly.  For this purpose, we renamed the
``transaction()`` method to ``raw_transaction()`` in all bindings to
signify it might fail.  This is how it looks in JavaScript:

.. code-block:: javascript

    await pool.rawTransaction(tx => {
      let val = await tx.query("...");
      await tx.execute("...", processValue(val));
    })

The Python equivalent is nearly identical:

.. code-block:: python

   async with db.raw_transaction() as tx:
       val = await tx.query("...")
       await tx.execute("...", process_value(val))

It doesn't look like much but the fact that it's the ``tx`` object
executing queries, instead of a raw connection, gives us some super
powers we can use now to seamlessly reconnect to the database in face of
network failures. To use that facility, use "retrying transaction" API
instead of "raw transaction", like this in JavaScript:

.. code-block:: javascript

    await pool.retryingTransaction(tx => {
      let val = await tx.query("...");
      await tx.execute("...", processValue(val));
    })

The Python equivalent looks a little different now due to the nature
of the language:

.. code-block:: python

   async for tx in db.retrying_transaction():
       async with tx:
           val = await tx.query("...")
           await tx.execute("...", process_value(val))

In both cases this isn't much code at all but it encapsulates important
pieces of behavior:

* it deals with transient network errors;

* a transaction is automatically retried on transaction serialization errors
  due to write contention;

* app-side code that is volatile might re-run alongside the database
  retry (see the ``process_value()`` in the examples above);

* the server is able to analyze the queries to ensure that they are
  safe to be retried.

We believe this sort of API will help to automatically deal with many of
the rare and thus overlooked issues in day-to-day database connectivity
programming and thus will improve the quality of your applications.

To help our users avoid transaction-related mistakes, we've disabled
the ability to start and commit transactions via the ``execute()`` methods.
Instead, the new ``retrying_transaction()`` or ``raw_transaction()`` constructs
are to be used.

A related issue here is to allow the database to come back up from
a restart, or to reconnect after a network topology reconfiguration.
To deal with *that* issue, we are now providing a
``wait_until_available`` option to all connection APIs.

For example, usage in JavaScript would look like this, the timeout
measured in milliseconds:

.. note::
    :class: aside

    **Note:** The ``connect()`` API is deprecated, and replaced by the
    :js:func:`docs:createClient` API in our latest bindings, see the
    :ref:`RC2 blog post <ref_rc2_pool>` for more details.

.. code-block:: javascript

  const conn = await edgedb.connect({
    dsn: "edgedb://edgedb@localhost/",
    waitUntilAvailable: 10000
  });

whereas in Python we use real numbers, measured in seconds:

.. code-block:: python

  con = edgedb.connect(
      user='edgedeb',
      wait_until_available=10
  )

This small API addition automatically deals with the following cases:

* domain name resolution failures;

* network failures: connection reset, connection aborted, connection
  refused as those might indicate the server is restarting or not ready
  yet; and

* a timeout reached during connection or authentication.

This means that ``wait_until_available`` is more than a simple
timeout for an individual connection attempt.  It's another case of
seamless retries in the face of a failure.  We believe this is such an
important case that as of now all clients default to a value of 30
seconds for this new connection option.

If you'd like to know more about our motivation and the design of this
functionality, you can read our open `RFC 1004 <robust_>`_ where those
features were first discussed.


A new first-party database client for Go
----------------------------------------

You can now import a pure Go database driver from
"github.com/edgedb/edgedb-go" in your Go applications.  It doesn't yet
provide all the features of edgedb-python and edgedb-js, but you can
already rely on the following:

* connection pooling;

* authentication from credential files generated by the ``edgedb server``
  CLI tool;

* ``RawTx`` and ``RetryingTx`` which is equivalents of ``raw_transaction()``
  and ``retrying_transaction()`` described in the section above;

* mapping native EdgeDB datatypes to Go equivalents, including
  ``math/big`` for BigInts, ``time.Time`` for datetimes, and
  byte array-encoded JSON for sending and receiving data.

Here is a brief example:

.. code-block:: go

    opts := edgedb.Options{
    	Database: "edgedb",
    	User: "edgedb",
    	MinConns: 1,
    	MaxConns: 4,
    }

    ctx := context.Background()
    conn, err := edgedb.Connect(ctx, opts)
    if err != nil {
    	log.Fatal(err)
    }
    defer conn.Close()

    var result string
    err = conn.QueryOne(ctx, "SELECT 'hello EdgeDB!'", &result)
    if err != nil {
    	log.Fatal(err)
    }

    fmt.Println(result)

This is how you'd insert data into the database:

.. code-block:: go

    err = edb.Execute(ctx, `
    	INSERT Movie {
    		title := 'Blade Runner 2049',
    		year := 2017,
    		director := (
    			INSERT Person {
    				first_name := 'Denis',
    				last_name := 'Villeneuve',
    			}
    		),
    		actors := {
    			(INSERT Person {
    				first_name := 'Harrison', last_name := 'Ford',
    			}),
    			(INSERT Person {
    				first_name := 'Ryan', last_name := 'Gosling',
    			}),
    			(INSERT Person {
    				first_name := 'Ana', last_name := 'de Armas',
    			}),
    		}
    	}`,
    )
    if err != nil {
    	log.Fatal(err)
    )

You can get data back as structs by passing an appropriate ``struct``
reference to ``Query``:

.. code-block:: go

    var out []Movie
    err = edb.Query(ctx, `
    	SELECT Movie {
    		title,
    		year,
    		director: { first_name, last_name },
    		actors: { first_name, last_name }
    	}`,
    	&out,
    )
    if err != nil {
    	log.Fatal(err)
    )

given a ``Movie`` and ``Person`` structs like:

.. code-block:: go

    type Person struct {
    	ID        UUID   `edgedb:"id"`
    	FirstName string `edgedb:"first_name"`
    	LastName  string `edgedb:"last_name"`
    }

    type Movie struct {
    	ID       UUID     `edgedb:"id"`
    	Title    string   `edgedb:"title"`
    	Year     int64    `edgedb:"year"`
    	Director Person   `edgedb:"director"`
    	Actors   []Person `edgedb:"actors"`
    }


One port to rule them all
-------------------------

EdgeDB's main data transfer protocol is
:ref:`binary<docs:ref_protocol_overview>`, which provides the best efficiency
when maintaining a stateful connection between the client
and the server.  EdgeDB also includes support for stateless HTTP requests,
most notably used in our GraphQL endpoint.  Prior to this release, a
separately configured network port was required to expose EdgeQL or GraphQL
over HTTP.  This design posed deployment challenges so now we have changed it:
the client now always connects to the primary EdgeDB network port and
the necessary protocol is determined during the handshake.  For HTTP the
"handshake" is simply a well-formed HTTP request.

This makes database deployments easier as a single networking port can
be used for specifying firewall rules, setting up monitoring and service
health checks.  Most importantly, users can now use the same connection
options for applications using the binary protocol, as well as HTTP,
including GraphQL.

HTTP allows use of EdgeDB in situations where there is no client of the
binary protocol available, or it is inconvenient to use because of its
long-running stateful connection nature.  One caveat of HTTP is that due
to its stateless nature it does not support database transactions.
Each request needs to be atomic.  Fortunately, EdgeQL allows complex queries
and mutations sent as a single statement, and
:ref:`expression aliases <docs:ref_datamodel_aliases>` and
:ref:`user-defined functions <docs:ref_eql_sdl_functions>` further enhance the
expressive power.

These alternative query protocols as other future extended EdgeDB functionality
is now packaged and declared as an *extension* and to enable GraphQL
functionality for a given database, you only need to add a single line to
your schema definition:

.. code-block:: sdl

    uses extension graphql;

followed by the usual ``edgedb migration create`` and ``edgedb migrate``, which
will enable the GraphQL endpoint at:
``http://<edgedb_host>:<edgedb_port>/<db_name>/graphql``.  The bundled
GraphiQL UI would become available at
``http://<edgedb_host>:<edgedb_port>/<db_name>/graphql/explore``.  See our
:ref:`GraphQL docs <docs:ref_graphql_index>` for more details on GraphQL
support in EdgeDB.


In closing
----------

EdgeDB Beta 1 is a significant milestone in our journey to build the `next
generation of database productivity <tenex_>`_.  We are proud and excited
to have reached the Beta phase, and there is much `more to come <roadmap_>`_.

:ref:`Download and run EdgeDB locally <docs:ref_quickstart_install>`,
or go through our `interactive EdgeQL tutorial <tutorial_>`_ without the need
to install anything.

We welcome new users and are ready to give assistance and debug issues.
Feel free to reach out `on GitHub Discussions <discussions_>`_, or ask in
a form of `a bug report or a feature request <github_>`_.

For future announcements, you can `find us on Twitter <twitter_>`_.


.. _tenex: /blog/a-path-to-a-10x-database
.. _robust:
    https://github.com/edgedb/rfcs/blob/master/text/1004-transactions-api.rst
.. _migrations_rfc:
    https://github.com/edgedb/rfcs/blob/master/text/1000-migrations.rst
.. _name_falsehoods:
    https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/
.. _download: /download
.. _github: https://github.com/edgedb/edgedb
.. _tutorial: https://www.edgedb.com/tutorial
.. _twitter: https://twitter.com/edgedatabase
.. _bettersql: /blog/we-can-do-better-than-sql
.. _edgedbjs: https://github.com/edgedb/edgedb-js/
.. _discussions: https://github.com/orgs/edgedb/discussions
.. _roadmap: /roadmap
