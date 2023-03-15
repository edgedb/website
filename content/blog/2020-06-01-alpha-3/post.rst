.. blog:authors:: ambv
.. blog:published-on:: 2020-06-03 01:00 PM PT
.. blog:lead-image:: images/alpha3.jpg
.. blog:guid:: 703C22E6-A39C-11EA-97F4-ACDE48001122
.. blog:description::
    EdgeDB 1.0 Alpha 3 "Proxima Centauri" is available for download.
    See what's been keeping us busy.

=====================================
EdgeDB 1.0 Alpha 3 "Proxima Centauri"
=====================================

After five months of work since `Alpha 2 <alpha2_>`_, we are happy to
announce the immediate release of EdgeDB 1.0 Alpha 3 "Proxima Centauri". You
can `download <download_>`_ it in a number of ways and use `a new interactive
tutorial <tutorial_>`_ to test it out without the need to install anything.

.. note::
    :class: aside-nobg

    :blog:github-button:`href:https://github.com/edgedb/edgedb|size:large|title:EdgeDB`

There's been an enormous amount of work around the database engine and we're
also busy making it easier for you to learn and use EdgeDB. Let's go through
some highlights of the release.

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


A new release calendar
----------------------

Before we talk technical details, let's talk about scheduling releases.
Historically we've always had big plans for each release and this is why they
have been so rare. Recently we came to the conclusion that more frequent and
granular releases will help us communicate our direction better, and most
importantly will get the latest features and fixes to the hands of our users
faster.

With this in mind, we are transitioning to a 6-week release cadence for
minor versions, at the moment looking at our alphas, betas, and release
candidates. While this necessarily means the future releases will be smaller,
i.e. more incremental, we feel like the rate of important changes will in
fact increase. We'll have more opportunity to share it with you as well.

By the way, we like the idea of making releases a little personal and so we
decided to pick codenames for them. We start in our immediate neighborhood,
looking at the closest star to our own Sun.

To be clear, as much as we'd like that, it's not our intention to crank
out a major EdgeDB version every six weeks. The increased release cadence
is meant for minor releases.

Rust Inside™️
-------------

As a team, we're quite invested in Python. It enabled us to iterate on EdgeDB
over the past decade, sometimes making sweeping design changes relatively
quickly. We've been quick adopters of Python 3 and in fact Proxima Centauri
is the first EdgeDB release to use the latest version of the language, Python
3.8, internally.

Python 3.8 and our internal optimization efforts led to some mild performance
gains. However, we are aware that for certain heavy-lifting tasks like our
query compiler, we won't be able to provide the level of
efficiency that we need using Python alone. We've been heavy users of Cython
for some of those "tight loops". And while we still have plenty of Cython
code in our codebase, we found that a relative newcomer to this programming
language niche looks excitingly promising and provides some unique
advantages.

Starting with Proxima Centauri, the EdgeDB server ships Rust code for some of
its functionality. The first bit moved to Rust is the query tokenizer.
Writing performant C extensions with Cython is much easier than using the
Python C API directly: it makes reference counting automatic and provides
native access to Python objects. Rust takes it a step further. When writing
Python extension in Rust, you're sure that Global Interpreter Lock (GIL) is
handled properly, and any access to a Python object is memory safe.
Compared to Cython, Rust extension code is more verbose as it provides more
explicit type conversions and error propagation. That verbosity is generously
compensated by Rust's rich type system that helps handling complex tasks.

We're also using Rust in another important piece of the puzzle: the EdgeDB
command-line tools. Having a single-file standalone binary compiled with
``rustc`` enables us to ship them to users with less effort and allows you to
install them faster and connect to EdgeDB servers easier.

It feels like using Rust was a natural choice for us. Our server codebase
already relies heavily on Python's static typing annotations and type
checking with Mypy. Rust is a natural extension of this idea with its strong
type system. On top of that, it allows zero-cost abstractions which we
find very elegant.

The lexer and the command-line tools are just the beginning. We'll report
more as our experience with Rust increases.

Try out EdgeDB without installing anything
------------------------------------------

Installing a database isn't very hard these days. That being said, it's still
a process which gets in the way if you only want to try a few queries out.
This is why we worked on `edgedb.com/tutorial <tutorial_>`_, an interactive
tutorial where you fire up EdgeQL queries and they are handled by actual
on-demand EdgeDB servers.

The tutorial is designed to introduce you to the database and the query
language. Spend 10 minutes with it and `let us know <discussions_>`_ what you
think!

Improved ergonomics of UPDATE
-----------------------------

Previously, to update a linked set of objects in an ``UPDATE`` statement,
you had to use an explicit ``UNION`` operation:

.. code-block:: edgeql

    UPDATE Movie
    FILTER .title = 'Dune'
    SET {
        actors := .actors UNION (SELECT Person FILTER .name = 'Javier Bardem')
    };

The new ``+=`` update operator in EdgeDB Alpha 3 makes it shorter to write
and easier to read:

.. code-block:: edgeql

    UPDATE Movie
    FILTER .title = 'Dune'
    SET {
        actors += (SELECT Person FILTER .name = 'Javier Bardem')
    };

The task of removing entries from a linked set in an ``UPDATE`` also got
much easier with the new ``-=`` operator:

.. code-block:: edgeql

    # Remove the high-priority label from Issue #100.
    UPDATE Issue
    FILTER .number = 100
    SET {
        labels -= 'high-priority'
    };

Laying groundwork for improved migrations
-----------------------------------------

We continued the work toward our goal of providing support for elaborate schema
and data migrations as the first-class feature of EdgeDB.  While there are
no user-facing changes in this release yet, the backend implementation for
schema reflection and introspection has been rewritten from scratch to use
autogenerated EdgeQL instead of hand-written SQL queries.  The result is a
much more reliable and efficient schema introspection mechanism.

Summary
-------

We're excited to share Proxima Centauri with you! It's a release that
provides foundation for some cool features we're working on right now. We
hope you like it!

As usual, the :ref:`change log <docs:ref_changelog_alpha3>` provides a detailed
story of the changes in this release.

If you have any questions, feel free to join `our community chat <discussions_>`_,
or ask in form of a bug report or a feature request `on GitHub <github_>`_.

If you'd like to learn more about our tech stack, we recently started `a
YouTube channel <youtube_>`_. At the moment we're running a series
introducing Python's ``asyncio``.

For future announcements, you can `find us on Twitter <twitter_>`_.


.. _alpha2: /blog/edgedb-1-0-alpha-2
.. _download: /download
.. _github: https://github.com/edgedb/edgedb
.. _discussions: https://github.com/orgs/edgedb/discussions
.. _tutorial: https://www.edgedb.com/tutorial
.. _twitter: https://twitter.com/edgedatabase
.. _youtube: https://www.youtube.com/c/EdgeDB
.. _bettersql: /blog/we-can-do-better-than-sql
