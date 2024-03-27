.. blog:authors:: colin
.. blog:published-on:: 2021-09-30 10:00 AM PT
.. blog:lead-image:: images/blog_rc1.jpg
.. blog:guid:: c40bb766-249f-45d5-a4b6-101ddda90113
.. blog:description::
    We're pleased to announce the first EdgeDB 1.0 Release Candidate.

==========================
EdgeDB Release Candidate 1
==========================

We're pleased to announce the first Release Candidate of EdgeDB. In a few
weeks, we'll release RC2, followed shortly thereafter by a long-awaited stable
1.0 release. Follow `@edgedatabase <https://twitter.com/edgedatabase>`_ to stay
apprised of new releases.

In the meantime: if you're looking to build something
with the future of relational databases: now is the time to start!

.. note:: :class: aside-nobg

    :blog:github-button:`href:https://github.com/edgedb/edgedb|size:large|title:EdgeDB`

This release is called Epsilon Eridani, named (as always) after a nearby star.
Epsilon Eridani is a mere 10.5 lightyears away and a sprightly 800
million years old. In Isaac Asimov's *Foundation* series (which just premiered
as a series on Apple TV+!), its solar system contained the first planet
colonized by non-Spacer Earthmen. In reality, neither of its two confirmed
planets are believed to be habitable. Nice try, Isaac.

As we rapidly approach 1.0, we continue to squash bugs, refine our
documentation, and streamline development and deployment workflows. Click a
link below to jump to the appropriate section of the post.


.. - :ref:`Improved development workflows <ref_rc1_prod_workflows>`
  .. - :ref:`Insecure mode for Docker <ref_docker>`
  .. - :ref:`Standardized connection behavior <ref_rc1_standard_cxn>`
.. - :ref:`Enhancements to client libraries <ref_rc1_client_libs>`
  .. - :ref:`Connection pooling by default<ref_rc1_pool>`
  .. - :ref:`Retry transactions on network errors <ref_rc1_retry_neterr>`

- :ref:`Linking remote instances <ref_rc1_instance_link>`
- :ref:`High Availability Postgres support <ref_rc1_ha>`
- :ref:`Global CLI configuration <ref_rc1_cli_config>`
- :ref:`Cardinality assertion <ref_rc1_cardinality>`
- :ref:`Enforcing distinctness in computed links <ref_rc1_distinct_links>`
- :ref:`Restructured documentation <ref_rc1_docs>`

What is EdgeDB?
===============

If you haven't heard of EdgeDB yet, it's a next-generation `open source
<github_>`_ relational database with an obsessive focus on developer
experience. Featuring:

* a declarative, object-oriented schema modeling system with multiple
  inheritance, key-less relations, computed properties, JSON support, and more
* a next-generation query language called `EdgeQL </showcase/edgeql>`_,
  featuring JOIN-less nested fetching, composable subquerying, and an extensive
  standard library
* performant, first-party database clients for `JavaScript/TypeScript
  <https://github.com/edgedb/edgedb-js>`_,
  `Python <https://github.com/edgedb/edgedb-python>`_, and
  `Go <https://github.com/edgedb/edgedb-go>`_ that implement our blazing fast
  binary protocol
* a unified ``edgedb`` CLI with idiomatic workflows for managing instances,
  opening REPLs, and creating and applying migrations
* built-in REST and GraphQL endpoints

And plenty more. Our goal is to modernize every aspect of the database
developer experience. Check out the :ref:`10-minute quickstart
<docs:ref_quickstart>` to learn more.

.. _ref_rc1_installation:

Upgrading/installation
----------------------

To get started, install the latest version of our CLI.

For first-time users:
^^^^^^^^^^^^^^^^^^^^^

Go through our 10-minute :ref:`Quickstart <docs:ref_quickstart>`; it'll walk
you through the process of installing EdgeDB, spinning up an instance,
creating/executing a migration, and running your first query.

For previous users:
^^^^^^^^^^^^^^^^^^^

Just run ``edgedb cli upgrade`` and the CLI will self-upgrade. If you have
local instances on your machine you'll need to upgrade those too:

- If you're using ``edgedb project``, navigate to the root directory of your
  project and run ``edgedb project upgrade --to-latest``. This will install
  the latest version of EdgeDB, upgrade the instance, migrate the data, and
  update your ``edgedb.toml``.

- To upgrade an instance that isn't linked to a project (not recommended), run
  ``edgedb instance upgrade <instance_name> --to-latest``.

Now onto the new features.



.. .. _ref_rc1_prod_workflows:

.. Improved development workflows
.. ==============================

.. _ref_rc1_instance_link:

Remote instance linking
=======================

Remote EdgeDB instances can now be "linked" to your machine with the ``edgedb
instance link`` command.

.. code-block:: shell

  $ edgedb instance link --dsn edgedb://username:password@hostname.com:5656
  Specify a new instance name for the remote server [default: hostname_5656]:
  > hostname_5656
  Successfully linked to remote instance. To connect run:
    edgedb -I hostname_5656

You now have a *remote instance* named ``hostname_5656``. You can now refer to
this instance by its name just like a local instance. You can even link this
instance to a local project during the ``edgedb project init`` workflow:

.. code-block:: shell

  $ edgedb project init
  Found `edgedb.toml` in `/path/to/dir`
  Initializing project...
  Specify the name of EdgeDB instance to use with this project:
  > hostname_5656
  # initialization...
  Project initialized.
  To connect to hostname_5656, run `edgedb`


.. .. _ref_docker:

.. Insecure mode for Docker
.. ========================

.. Some users prefer to run EdgeDB in a Docker container in development to
.. standardize their development and production workflows. This approach is
.. supported, but creates some friction with the recommended CLI-based workflows.

.. When you create a local EdgeDB instance for development purposes, EdgeDB stores
.. its credentials in your file system. (The precise location varies based on
.. operating system; run ``edgedb info`` to view the absolute system paths EdgeDB
.. uses.) When you connect to a given instance (say, ``my_instance``) the CLI and
.. client libraries look up the stored credentials for that instance in the
.. appropriate location on disk.

.. Because Docker-based instances are running in a sandboxed container, the
.. ``edgedb`` CLI and local client libraries can't access their credentials. To
.. support this case, we're introducing a new environment variable called
.. ``EDGEDB_INSECURE_DEV_MODE``.

.. As the name implies, this is not to be used in production. When set to
.. ``"true"`` in the server environment (wherever your EdgeDB instances live), it
.. entirely disables all password-based authentication and allows unencrypted HTTP
.. traffic. When present in the client environment (where your backend code runs),
.. all client libraries will trust self-signed TLS certificates. This makes it
.. simple to connect to local Docker-based EdgeDB instances with the flip of a
.. switch.

.. .. _ref_rc1_standard_cxn:

.. Standardized connection behavior
.. --------------------------------

.. When connecting to EdgeDB with the CLI or client libraries, there are several
.. ways to uniquely identify your instance.

.. - Instance name: ``edgedb -I my_instance``
.. - DSN (data source name): ``edgedb --dsn edgedb://user:password@db.domain.com:1234``
.. - Host and/or port: ``edgedb -H db.domain.com -P 5656``
.. - Credentials file (a reference to a JSON file containing connection
..   information): ``edgedb --credentials-file``

.. Connections may also require certain "granular parameters":

.. - Username: ``-u/--user`` or ``EDGEDB_USER``
.. - Password: ``--password`` or ``EDGEDB_PASSWORD``
.. - Database name: ``-d/--database`` or ``EDGEDB_DATABASE`` (defaults to
..   ``edgedb``)
.. - TLS parameters: ``--tls-ca-file`` and ``--tls-verify-hostname``

.. Moreover, there are several ways to pass this connection information to the CLI
.. or client libraries:

.. - Explicitly, with command line flags in the CLI or as arguments to the client
..   libraries' ``connect`` function
.. - With environment variables, like ``EDGEDB_DSN``
.. - Not at all: when you're inside a project directory, the CLI/client libraries
..   discover and connect to the linked instance automatically.

.. What happens if you specify multiple conflicting connection methods? What is
.. the relative priority of environment variables vs explicit parameters vs
.. project-based instance discovery?

.. In RC1 we've standardized this behavior across the CLI and all client
.. libraries. Here's a simple breakdown:

.. - There are three "priority levels". Specifying connection information in a
..   higher priority level entirely overrides any and all connection information
..   specified at a lower level. From highest to lowest priority: 1) explicit
..   connection parameters, 2) environment variables, 3) implicit (project-based)
..   connections.
.. - Ambiguity within a given priority level is not allowed. For instance,
..   specifying both ``EDGEDB_DSN`` and ``EDGEDB_INSTANCE`` environment variables
..   will throw an error.
.. - So-called "granular parameters" (username, password, database, and TLS
..   settings) can override individual components of non-granular parameters
..   specified at the same or lower priority level. For instance, ``EDGEDB_USER``
..   will override a username specified within ``EDGEDB_DSN``, but will have no
..   effect when using ``--dsn``.

.. For a full breakdown of this resolution algorithm, consult the `GitHub
.. discussion <https://github.com/edgedb/edgedb/discussions/2922>`_ on the subject.

.. _ref_rc1_ha:

High Availability Postgres support
==================================

EdgeDB runs on top of Postgres. Commonly, EdgeDB internally manages its own
Postgres instances, but it can also be run on top of a cloud- or self-hosted
Postgres.

API-based HA
------------

Some cluster management tools are capable of emitting events when the leader
node fails. In this case, EdgeDB automatically listens to these events and
directs all queries to the current leader node.

To indicate to EdgeDB that API-based HA is possible with your setup, specify
the appropriate protocol in your ``--backend-dsn``. Currently EdgeDB only
supports API-based HA when using
`Stolon <https://github.com/sorintlab/stolon>`_ as the backend in a
Consul-based setup.

* ``stolon+consul+http://``
* ``stolon+consul+https://``

Adaptive HA
-----------

Most cloud-based Postgres hosting services are DNS-based; these systems update
DNS records with the IP address of the current leader node. There's no direct
way for EdgeDB to get notified of failover events; instead, EdgeDB uses some
heuristics and an internal state machine to determine when a backend has
initiated failover. For details on this implementation, check out the
:ref:`Backend HA docs <docs:ref_backend_ha>`.

When failover is detected, EdgeDB terminates and re-establishes all connections
with the backend. Since EdgeDB doesn't cache resolved DNS values, the new
connections will be established to the new leader node.

Enable adaptive HA with the ``--enable-backend-adaptive-ha`` flag like so:

.. code-block:: bash

    $ edgedb-server \
        --backend-dsn postgres://xxx.rds.amazonaws.com \
        --enable-backend-adaptive-ha


.. .. _ref_rc1_client_libs:

.. Enhancements to client libraries
.. ================================

.. We put a tremendous amount of effort into providing best-in-class client
.. libraries that are scalable and fault-tolerant out of the box. In that spirit,
.. we've made some enhancements across our client libraries for `JavaScript/
.. TypeScript <jslib_>`_, `Python <pythonlib_>`_, and `Go <golib_>`_.

.. .. _ref_rc1_pool:

.. Connection pooling by default
.. -----------------------------

.. In modern backend development, connection pooling is a best practice; your
.. API's throughput shouldn't be bottlenecked by the capacity of single physical
.. connection to your database. As such, the top-level ``connect`` function in
.. EdgeDB client libraries now returns a *connection pool*. This functionality was previously available via the ``createPool`` function (now deprecated).

.. In the example below, all four queries are executed in parallel using separate
.. physical connections. Previously, each would have been executed serially,
.. bottlenecked by the single connection returned from ``edgedb.connect``.

.. .. code-block:: typescript

..     import * as edgedb from "edgedb";

..     async function main(){

..       const pool = await edgedb.connect();

..       const results = await Promise.all([
..         pool.querySingle(`SELECT 0`),
..         pool.querySingle(`SELECT 1`),
..         pool.querySingle(`SELECT 2`),
..         pool.querySingle(`SELECT 3`),
..       ]);
..       // [0, 1, 2, 3]
..     }

.. To replicate the old behavior, just create a pool with concurrency ``1``:

.. .. code-block:: typescript

..     import * as edgedb from "edgedb";

..     const pool = await edgedb.connect({ concurrency: 1 });

.. If not specified, the maximum pool size is determined from a hint sent by the
.. server upon connection. Currently, this hint is fixed at 100, though this is
.. subject to change. We're evaluating ways of determining the value heuristically
.. based on the number of connections available in the underlying Postgres
.. instance and dynamically managing the total connection pool size across all
.. active clients.

.. .. _ref_rc1_retry_neterr:

.. Retrying transactions on network errors
.. ---------------------------------------

.. All client libraries include the concept of a "retrying transaction". These
.. transactions detect when "retryable" errors occur and automatically re-attempt
.. the transaction. Network errors are now considered "retryable"; when a network
.. error interrupts a transaction, the library will automatically rollback the
.. previous transaction, re-establish a connection, and re-attempt the transaction.

.. To learn more about how EdgeDB libraries handle transaction retries, check out
.. the `Client API RFC <https://github.com/edgedb/rfcs/blob/master/text/1004-transactions-api.rst>_`.


.. _ref_rc1_cli_config:

Global CLI configuration
========================

You can now persistently customize the behavior of the CLI and REPL across your
system with a global configuration file. Just create a file called ``cli.toml``
in your EdgeDB config directory. The location of this directory differs between
operating systems; to find its location on your system, run ``edgedb info``.

.. code-block:: shell

    $ edgedb info
    EdgeDB uses the following local paths:
    ┌────────────┬─────────────────────────────────────────────────────────────────┐
    │ Cache      │ /Users/colinmcd94/Library/Caches/edgedb/                        │
    │ Config     │ /Users/colinmcd94/Library/Application Support/edgedb/           │
    │ CLI Binary │ /Users/colinmcd94/Library/Application Support/edgedb/bin/edgedb │
    │ Data       │ /Users/colinmcd94/Library/Application Support/edgedb/data/      │
    │ Service    │ /Users/colinmcd94/Library/LaunchAgents/                         │
    └────────────┴─────────────────────────────────────────────────────────────────┘

Navigate to the directory labelled "Config" and create a file called
``cli.toml`` with the following structure. All fields are optional.

.. code-block::

    [shell]
    expand-strings = true         # Stop escaping newlines in quoted strings
    history-size = 10000          # Set number of entries retained in history
    implicit-properties = false   # Print implicit properties of objects
    implicit-limit = 100          # Set implicit LIMIT
                                  # Defaults to 100, specify 0 to disable
    input-mode = "emacs"          # Set input mode. One of: vi, emacs
    output-format = "default"     # Set output format.
                                  # One of: default, json, json-pretty, json-lines
    print-stats = false           # Print statistics on each query
    verbose-errors = false        # Print all errors with maximum verbosity


.. _ref_rc1_cardinality:

Cardinality assertion
=====================

RC1 introduces a new top-level function ``assert_exists``, the complement of
``assert_single`` (which was introduced in Beta 3). Calling ``assert_exists``
on an expression ensures at runtime that it includes at least one element; if
the set is empty, an error is thrown.

.. code-block:: edgeql-repl

    db> SELECT assert_exists((SELECT User FILTER .name = "Existing user"))
    {default::User {id: ...}}

    db> SELECT assert_exists((SELECT User FILTER .name = "Nonexistent user"))
    ERROR: CardinalityViolationError: assert_exists violation: expression
      returned an empty set.

Notably, the function enables the declaration ``required`` computed links and
properties in object types, which was not previously possible.


.. _ref_rc1_distinct_links:

Enforcing distinctness in computed links
========================================

In the documentation, we use the term *set* to refer to the result of an EdgeDB
expression; strictly speaking, though, EdgeDB sets are actually *multisets*, as
they can contain duplicate elements in certain cases.

Until now, EdgeDB treated "real" and computed links differently. All "real"
links were guaranteed to return a distinct set of results — no duplicates. This
is implicitly enforced by how EdgeDB persists links under the hood.
However, computed links weren't subject to this constraint.

This is problematic. Practically speaking, an application's logic may be
written in such a way that it doesn't expect duplicates in the results of a
query. Philosophically speaking, this inconsistency runs counter to the `design
principles </blog/a-path-to-a-10x-database#design-principles>`_ of EdgeDB.

So we fixed it. All computed links must now correspond to expressions that
are *guaranteed to be distinct*. If this guarantee cannot be inferred, EdgeDB
will throw an error during query compilation.

In most cases, distinctness can be properly inferred; however, subqueries
containing ``UNIONs`` and ``FOR`` loops may return sets with duplicates. To
accommodate this new constraint, users may either use the existing ``DISTINCT``
operator (which eliminates all duplicates from its operand) or the new
``std::assert_distinct`` assertion function.

Using ``std::assert_distinct`` is preferable in certain situations becauase it
*preserves the order* of the result set, unlike ``DISTINCT``. If you don't
expect duplicates to occur in your computed link, use ``std::assert_distinct``;
if you do, use ``DISTINCT``.


.. _ref_rc1_docs:

Restructured documentation
==========================

We've made some changes to the structure of our documentation to make it more
approachable for new users.

- The reference documentation for all built-in operators and functions has been
  moved from the EdgeQL section to a new top-level section called :ref:`Standard
  Library <docs:ref_std>`. The EdgeQL section still contains breakdowns
  of the major concepts and language constructs.
- We've merged the :ref:`Quickstart <docs:ref_quickstart>` and
  :ref:`Cheatsheets <docs:ref_cheatsheets>` page into a unified
  :ref:`Guides <docs:ref_guides>` section. We've also written several new guides
  on broadly useful subjects like
  :ref:`Updating Data <docs:ref_cheatsheet_update>`
  and :ref:`Defining Object Types <docs:ref_cheatsheet_object_types>`.



Wrapping up
===========

For a full breakdown of the bug fixes and stability improvements in RC1,
check out the full :ref:`Changelog <docs:ref_changelog_rc1>`.

Looking to learn more about EdgeDB?

* If you're just starting out, go through 5-minute :ref:`Quickstart guide
  <docs:ref_quickstart>`.
* To dig into the EdgeQL query language, try the web-based `interactive
  tutorial </tutorial>`_ — no need to install anything.
* For an immersive, comprehensive walkthrough of EdgeDB concepts, check out
  our illustrated e-book `Easy EdgeDB </easy-edgedb>`_. It's designed to walk
  a total beginner through EdgeDB, from the basics all the way through
  advanced concepts.

To keep tabs on future announcements, follow us on Twitter
`@edgedatabase <https://twitter.com/edgedatabase>`_!

.. _jslib: https://github.com/edgedb/edgedb-js
.. _pythonlib: https://github.com/edgedb/edgedb-python
.. _golib: https://github.com/edgedb/edgedb-go
.. _github: https://github.com/edgedb/edgedb
.. _bettersql: /blog/we-can-do-better-than-sql
