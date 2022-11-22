.. blog:authors:: ambv
.. blog:published-on:: 2020-07-16 01:00 PM PT
.. blog:lead-image:: images/alpha4.jpg
.. blog:guid:: e7e5103c-c557-11ea-937a-f218981747c2
.. blog:description::
    EdgeDB 1.0 Alpha 4 "Barnard's Star" is available for download.
    See the highlights of this release.


===================================
EdgeDB 1.0 Alpha 4 "Barnard's Star"
===================================

After six weeks of work since `Alpha 3 <alpha3_>`_, we are happy to
announce the immediate release of EdgeDB 1.0 Alpha 4 "Barnard's Star". You
can `download <download_>`_ it in a number of ways or try it out in our
`interactive tutorial <tutorial_>`_ without the need to install anything.

.. note::
    :class: aside-nobg

    :blog:github-button:`href:https://github.com/edgedb/edgedb|size:large|title:EdgeDB`

This time around we focused on making the database more intuitive from
both the server and the client perspective.  While there's fewer changes
due to our newly adopted six-week release cycle, we're able to deliver them
to you much quicker.  Let's go through some highlights of the release!

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


Improved Usability of Server Instance Maintenance
-------------------------------------------------

One of the ways in which we're setting EdgeDB apart from previous generation
databases is the focus on usability of day-to-day tasks.  One particularly
gnarly topic is maintenance of server instances: installing a new version,
upgrading existing databases to a new version, setting up an instance to
run properly as a service daemon, accessing logs, and so on.  It gets
especially tricky when multiple operating systems provide their own unique
ways to achieve those tasks.  Even better if the user needs to keep
a few versions running concurrently.

We looked at how efficient `rustup <rustup_>`_ is in ensuring the user
has a fully functional up-to-date installation of the Rust toolchain,
and got inspired: what if we can provide *this* experience for a database?

The end result is the new ``edgedb server`` group of commands that ships with
the default EdgeDB CLI. Its design was planned and discussed as part of an
RFC process which, as the rest of EdgeDB, is open. `Check it out
<edbserver_>`_!

The most visible change related to ``edgedb server`` is that it is now
the new recommended way to install EdgeDB servers on your operating
system.  See ``edgedb server install --help`` for details.  The
underlying installer will still use your operating system's package
manager but it provides instance configuration in ways that allow for
running multiple EdgeDB versions concurrently on one machine.  And with
``edgedb server upgrade`` you can easily bump the version on an existing
installation without having to redo configuration or dump and restore
data manually.

And how do you get the new CLI tool on your machine?  We redesigned the
`Download <download_>`_ page to be more inviting, providing a new
cross-platform way to install EdgeDB with a single-liner in the terminal.
And if you're a macOS user, you might want to use our new Homebrew tap!


JavaScript Bindings Got More Powerful
-------------------------------------

We supercharged `edgedb-js <edgedbjs_>`_, our JavaScript client for EdgeDB,
with an efficient :ref:`connection pooling <docs:edgedb-js-driver>`
implementation. This allows users write faster applications with less code.

.. note::
    :class: aside-nobg

    :blog:github-button:`href:https://github.com/edgedb/edgedb-js|size:large|title:edgedb-js`

.. note::
    :class: aside

    **Note:** The ``createPool`` API is deprecated in our latest client
    bindings. It has been replaced with the :js:func:`docs:createClient`
    API, see our :ref:`RC2 blog post <ref_rc2_pool>` for more details.

.. code-block:: javascript

    import {createPool} from 'edgedb';

    // Initialize the pool; should be done when
    // the nodejs app server starts:

    const pool = await createPool({
      connectOptions: {
        user: "edgedb",
        host: "x.x.x.x",
      },
      minSize: 5,  // start with 5 connections
      maxSize: 50  // and grow the pool up to 50 connections
    });

    // Later you can easily make requests using this pool.
    // If you don't need transactions:

    await pool.query('SELECT 42');

    // or get a proper Connection object in a variety of ways:

    await pool.run(async (conn) => {
      conn.execute('START TRANSACTION');
      try {
        conn.query('SELECT business_logic(10 / $num)', {num: 42});
      } finally {
        conn.execute('ROLLBACK');
      }
    });

    // or:

    const conn = await pool.acquire();
    try {
      conn.query('SELECT datetime_current();');
    } finally {
      await pool.release(conn);
    }

.. _alpha4_fetch_rename:

We also thought hard about the API and decided that ``fetch*()`` function
names don't really sound very natural when you're trying to insert or update
data. We renamed them to ``query*()`` which is the obvious name in hindsight:

.. code-block:: javascript

    async function example(conn) {
      // Use `conn.query()` instead of `conn.fetchAll()`:
      await conn.query(`
        INSERT User {
          name := 'Alice'
        }
      `)
    }

The change actually originated in our Python client and this is `where the
change was discussed <query_>`_.


DESCRIBE Is Worth a Thousand Greps
----------------------------------

As part of the usability sprint we made ``DESCRIBE`` better.  When
describing objects, it will now list all matches for the specified name
if available.  This is particularly interesting in case of user functions
masking user types or standard types/functions.

``DESCRIBE ROLES`` and ``DESCRIBE SYSTEM CONFIG`` in turn allow you to
quickly assess the respective areas of the database, and make dumping an
entire server instance easier.


Stored Migrations Are Coming
----------------------------

The back-end implementation for the much improved workflow for migrations
is mostly complete.  The next step is providing a CLI for it, which we
plan to release as part of Alpha 5.

We think this set of features will be an important foundation of successful
EdgeDB adoption. You can read more about them in our `open RFC document
<migrations_>`_ on the topic.


You Can Talk To Us Right On GitHub
----------------------------------

GitHub is introducing a new feature called `Discussions <discussions_>`_, a
way to keep conversations happen close to the code which don't really belong
in Issues or Pull Requests.

We used to use Spectrum Chat for this purpose but as soon as we tried out
Discussions, we knew this is a natural fit for us and our community.
We're an open product with a strong GitHub presence and you probably already
have a GitHub account... so `come talk to us! <discussions_>`_


Summary
-------

Barnard's Star is the first release under our new release cycle. Our ambition
is to always deliver frontpage-worthy new features, but we also understand
those never get built in one development sprint.  At the same time, frequent
milestones have many advantages both for us and our users.

With this in mind we're proud to share Barnard's Star with you, a release
which is a step forward that tells a story.  We hope you'll enjoy the
improvements we've made, and just as importantly, come along for the
ride and witness how they're built *as they are being built*.

As usual, the :ref:`change log <docs:ref_changelog_alpha4>` provides a detailed
story of the changes in this release.

If you have any questions, feel free to join the conversation `on GitHub
Discussions <discussions_>`_, or ask in form of `a bug report or a feature
request <github_>`_.

If you'd like to learn more about our tech stack, we recently started `a
YouTube channel <youtube_>`_. At the moment we're running a series
introducing Python's ``asyncio``.

For future announcements, you can `find us on Twitter <twitter_>`_.


.. _alpha3: /blog/edgedb-1-0-alpha-3-proxima-centauri
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
