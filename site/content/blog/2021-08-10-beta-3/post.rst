.. blog:authors:: colin
.. blog:published-on:: 2021-08-12 10:00 AM PT
.. blog:lead-image:: images/beta_3_post.jpg
.. blog:guid:: 1ebc3199-ed4a-4442-9868-96a7aea698e5
.. blog:description::
    With the release of Beta 3, EdgeDB gets even better with a revamped CLI,
    top-level free shapes in queries, simplified enum syntax, and a new
    "relative duration" type. Plus, we enable TLS by default on all EdgeDB
    instances.

=====================
EdgeDB Beta 3: "Ross"
=====================

We're pleased to announce the release of EdgeDB Beta 3: "Ross".

As always, this release is named after a nearby star: Ross
128, a red dwarf in the equatorial zodiac constallation of Virgo, about 11.007
light-years from Earth. Fun fact: it's the origin of the alien species in the
2019 TV adaptation of "War of the Worlds" (in a departure from the original
novel, where the invaders are from Mars).
[`Wikipedia <https://en.wikipedia.org/wiki/Ross_128>`_]

Ross 128 may be a dwarf star, but this release is big. It features major
enhancements to EdgeDB spanning security, tooling, and EdgeQL syntax. Click a
link below to jump to that section.

- :ref:`A re-designed CLI <ref_cli>`
- :ref:`Free shapes <ref_free_shapes>`
- :ref:`Simplified enum syntax <ref_enum_syntax>`
- :ref:`A "relative duration" type <ref_relative_duration>`
- :ref:`TLS support <ref_tls>`

This is our final beta release! For the next few weeks, we'll be focusing on
stability and bugfixes in anticipation for an RC release, followed shortly by
a 1.0 release (finally!). Follow `@edgedatabase
<https://twitter.com/edgedatabase>`_ to stay apprised of new releases.


What's EdgeDB?
==============

.. pull-quote::

  Skip to the :ref:`new features <ref_cli>` if you're
  already familiar with EdgeDB.

EdgeDB is an advanced `open source <github_>`_ relational database designed
with an obsessive focus on developer experience. It addresses the
`shortcomings of SQL databases <bettersql_>`_ without sacrificing speed,
safety, or expressive power.

Built atop PostgreSQL, EdgeDB takes the best features of SQL, ORMs, and
GraphQL—declarative schemas, migrations, easy deep fetching—and bakes them
into a strict relational database:

* an expressive and composable query language called EdgeQL;
* a high-level data model and type system;
* first-class support for schema migrations;
* built-in JSON conversion and parsing;
* out-of-the-box interoperability via REST and GraphQL;
* first-party database clients for `JavaScript/TypeScript
  <https://github.com/edgedb/edgedb-js>`_,
  `Python <https://github.com/edgedb/edgedb-python>`_, and
  `Go <https://github.com/edgedb/edgedb-go>`_.

.. _ref_installation:

Installation
============

To get started with Beta 3, first install the latest version of
our CLI.

If you've never used EdgeDB before
----------------------------------

First, install the CLI with a single command:

.. code-block:: shell

    # macOS/Linux
    $ curl --proto '=https' --tlsv1.2 -sSf https://sh.edgedb.com | sh

    # Windows
    $ iwr https://ps1.edgedb.com/ -useb | iex

Then go through our 5-minute :ref:`Quickstart <docs:ref_quickstart>` to spin up
your first EdgeDB instance!

If you have an older version installed
--------------------------------------

Run ``edgedb self-upgrade`` to get the latest CLI version, then run ``edgedb
cli migrate``. We've restructured how the EdgeDB CLI stores configuration
files under the hood, so ``edgedb cli migrate`` is required to update all
existing configs to the new format. This command does not upgrade any
instances.

.. pull-quote::

  If your projects rely on one of EdgeDB's client libraries, upgrade those
  to the latest version! Older versions of the client libraries aren't
  compatible with Beta 3.

To upgrade existing instances, you have a couple options:

- If you're using ``edgedb project``, navigate to the root directory of your
  project and run ``edgedb project upgrade --to-latest``. This will install
  the latest version of EdgeDB, upgrade your instance, and update your
  ``edgedb.toml``.

- If you have instances that aren't linked to a project (not recommended), you
  can upgrade those simultaneously with ``edgedb instance upgrade
  --local-minor``.

Now onto the new features!

.. _ref_cli:

A re-designed CLI
=================

Designing APIs for command line tools is hard.

Until now, we've tried to conform to a consistent ``edgedb <action>``
structure: ``edgedb create-database``, ``edgedb list-databases``, ``edgedb
migrate``, etc. This results in lots of hyphenated commands, but it's a
simple, flat structure that lends itself to autocompletion and scannable
``--help`` output.

But with the recent introduction of ``edgedb server`` and ``edgedb project``
command sets, this approach became untenable. We've decided to re-design our
CLI to conform to a more conventional ``edgedb <group> <action>`` structure.
This means fewer hyphens (yay!) and a more intuitive API::

    CLI COMMANDS:

    dump                     Create a database backup
    restore                  Restore a database backup from file
    configure                Modify database configuration
    query                    Execute EdgeQL queries
    info                     Show information about the EdgeDB
                             installation

    migration apply          Apply all unapplied migrations
    migration create         Create a migration script
    migration status         Show current migration state
    migration log            Show all migration versions
    migrate                  An alias for `edgedb migration apply`

    project init             Initialize a new or existing project
    project unlink           Clean-up the project configuration
    project info             Get various metadata about the project
    project upgrade          Upgrade EdgeDB instance used for the
                             current project

    instance create          Initialize a new EdgeDB instance
    instance list            Show all instances
    instance status          Show status of a matching instance
    instance start           Start an instance
    instance stop            Stop an instance
    instance restart         Restart an instance
    instance destroy         Destroy an instance / remove the data
    instance link            Link a remote instance
    instance unlink          Unlink a remote instance
    instance logs            Show logs of an instance
    instance upgrade         Upgrade installations and instances
    instance revert          Revert a major instance upgrade
    instance reset-password  Reset password for a user in the
                             instance

    server                   Manage local EdgeDB installations

    database create          Create a new DB

    describe object          Describe a database object
    describe schema          Describe the schema

    list                     List databases, object types, and more

    cli upgrade              Upgrade the 'edgedb' command-line tool



One noteworthy change: we've split up ``edgedb server`` into two buckets:
``edgedb server`` and ``edgedb instance``. We realized that ``edgedb server``
was actually two tools mushed together:

#. A tool for managing installed EdgeDB versions, e.g. ``edgedb
   server {install|uninstall|list-versions}``. These commands are staying the
   same.

#. A tool for managing local EdgeDB instances, e.g. ``edgedb server init``,
   ``edgedb server stop``, etc. These commands are being moved under ``edgedb
   instance``: ``edgedb instance start``, ``edgedb instance destroy``, etc.
   Notably, ``edgedb server init`` is now ``edgedb instance create``, to be
   more consistent with the ``create`` commands for databases and migrations.

API design is hard, but we're confident this new CLI is easier to learn, use,
and understand.

.. _ref_free_shapes:

Free shapes
================

EdgeQL now supports top-level "free shapes", so called because they
aren't bound to a pre-existing object type. They provide a new way to
execute several expressions in a single query.

.. code-block:: edgeql

    # simple expressions
    SELECT {
      string := "Iron Man",
      number := std::random(),
      boolean := (SELECT std::random() < 0.5)
    }

This provides a convenient way to aggregate the results of several subqueries,
regardless of their cardinality, which wasn't previously possible. Free shapes
can be used at any level of depth within a query, not just the top level.

.. code-block:: edgeql

    # complex expressions
    SELECT {
      empty_set := <str>{},
      users := (SELECT User),
      blog_posts := (SELECT BlogPost),
      number_of_users := count((SELECT User)),
      nested_shape := { nesting_level := 2 }
    }

This is particularly useful when used in conjunction with ``WITH`` clauses.
Below, we use free shapes to implement a simple pagination query.

.. code-block:: edgeql

    WITH
      skip := <int64>$skip,
      remaining_users := (SELECT User ORDER BY .id OFFSET skip),
      page_results := (SELECT remaining_users LIMIT 10)
    SELECT {
      page_results := page_results { id, name },
      next_offset := skip + count(page_results),
      has_more := count(remaining_users) > 10
    };


This is a convenient way to execute several expressions at once. Under the
hood, each element in the shape is executed as a separate subquery, then the
results are merged into a "virtual object". There is no direct analog for this
syntax in SQL.

.. _ref_enum_syntax:

Simplified enum syntax
======================

In earlier versions, specifying a particular element of an enum required
explicitly casting a string literal:

.. code-block:: edgeql

    SELECT User
    FILTER .relationship_status = <RelationshipStatus>'ItsComplicated'

Now EdgeQL supports a more familiar dot notation syntax:

.. code-block:: edgeql

    SELECT User
    FILTER .relationship_status = RelationshipStatus.ItsComplicated

.. _ref_relative_duration:

A new "relative duration" type
==============================

Beta 3 introduces :eql:type:`docs:cal::relative_duration`, a new
built-in type for date manipulation. Unlike ``std::duration``,
``cal::relative_duration`` does not represent a precise measurement of time;
instead, it represents "calendar durations" like "3 months" or "2 years".
Because all years and months don't have the same number of days, you can't
simply represent these values as some number of milliseconds.

.. code-block:: edgeql-repl

    edgedb> SELECT <cal::relative_duration>'2 years 3 months'
    {<cal::relative_duration>'P2Y3M'}

Previously, it was difficult to perform logical operations such as "postpone
this event by a year" without resorting to fiddly manipulations of ISO date
strings. With ``relative_date`` it's very simple and explicit:

.. code-block:: edgeql-repl

    edgedb> WITH
    .......   initial_date := <datetime>'2020-01-01T00:00:00Z',
    .......   delta := <cal::relative_duration>'1 year'
    ....... SELECT initial_date + delta;
    {<datetime>'2021-01-01T00:00:00Z'}

Read the full documentation :eql:type:`here <docs:cal::relative_duration>`.

.. _ref_tls:

TLS support
===========

EdgeDB now supports TLS connections, allowing for fully encrypted client/
server communication and mitigating the risk of eavesdropping or
man-in-the-middle attacks. TLS is also *required* for all instances running
Beta 3 or later.

To that end, all EdgeDB instances now require a certificate and private key to
establish secure connections with the client.

- For local development instances, a self-signed certificate will be
  auto-generated when you upgrade your instances to Beta 3 or later.

- For production instances, it is recommended to generate a certificate/key
  pair using a third-party certificate authority like
  `Let's Encrypt <https://letsencrypt.org/getting-started/>`_. If you're using
  the `EdgeDB Docker image <https://github.com/edgedb/edgedb-docker>`_, you
  can provide paths to these files with the ``EDGEDB_TLS_CERT_FILE`` and
  ``EDGEDB_TLS_KEY_FILE`` environment variables
  (`docs <https://github.com/edgedb/edgedb-docker>`_). Alternatively, provide
  these paths to ``edgedb-server`` using the ``--tls-cert-file`` and
  ``--tls-key-file`` flags.

These certificates are automatically validated by the EdgeDB client libraries
for `JavaScript/TypeScript
<https://github.com/edgedb/edgedb-js>`_, `Python
<https://github.com/edgedb/edgedb-python>`_, and `Go
<https://github.com/edgedb/edgedb-go>`_.

Start using Beta 3
==================


For a full breakdown of the bug fixes and stability improvements in Beta 3,
check out the full :ref:`Changelog <docs:ref_changelog_beta3>`.

Looking to learn more about EdgeDB?

* If you're just starting out, try the 5-minute :ref:`Quickstart
  <docs:ref_quickstart>`.
* To dig into the EdgeQL query language, try the web-based `interactive
  tutorial </tutorial>`_ — no need to install anything.
* For an immersive, comprehensive walkthrough of EdgeDB concepts, check out
  our illustrated e-book `Easy EdgeDB </easy-edgedb>`_. It's designed to walk
  a total beginner through EdgeDB, from the basics all the way through
  advanced concepts.

To keep tabs on future announcements, follow us on Twitter
`@edgedatabase <https://twitter.com/edgedatabase>`_!

.. _github: https://github.com/edgedb/edgedb
.. _bettersql: /blog/we-can-do-better-than-sql
