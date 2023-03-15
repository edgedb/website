.. blog:authors:: colin
.. blog:published-on:: 2021-05-06 03:01 PM PT
.. blog:lead-image:: images/beta_2_post.jpg
.. blog:guid:: eec72a25-0729-4d62-a298-1c8bd63a4c2d
.. blog:description::
    With this Beta 2 release, EdgeDB stabilizes in preparation for our 1.0
    launch. Plus, we introduce a new interactive tool for configuring EdgeDB
    projects.

================================
Announcing EdgeDB Beta 2: Luyten
================================

Looking to another nearby star, we're pleased to announce the second public
beta of EdgeDB: Luyten!

.. note::
    :class: aside

    Luyten 726-8, also known as Gliese 65, is a binary star system that is one
    of Earth's nearest neighbors, at about 8.7 light years from Earth in the
    constellation Cetus. Luyten 726-8B is also known under the variable star
    designation UV Ceti, being the archetype for the class of flare stars.
    [`Wikipedia <https://en.wikipedia.org/wiki/Luyten%27s_Star>`_]


Back in February 2021, we released the first beta version of EdgeDB after three
years in development and 7 alpha releases. Since then, we've shifted focus from
implementing new features to improving stability and performance. And we did:
this release is the culmination of 10 weeks of fixes and enhancements.

But we couldn't help ourselves! We're excited to introduce a new interactive
CLI tool called ``edgedb project``—a project scaffolding tool that makes the
process of setting up an EdgeDB-powered project even easier—, plus Deno
support, customizable transaction settings for our client libraries, and more!

.. note:: :class: aside-nobg

    :blog:github-button:`href:https://github.com/edgedb/edgedb|size:large|title:EdgeDB`


What's EdgeDB?
==============

EdgeDB is an advanced `open source <github_>`_ relational database based on
PostgreSQL. The project aims to give developers and data engineers a highly
efficient and productive database technology while addressing the `shortcomings
of SQL <bettersql_>`_ and its surrounding ecosystem.

It takes the best features of ORMs and GraphQL—declarative schemas, migrations,
easy deep fetching—and bakes them into a strict relational database:

* a high-level data model and type system;
* a powerful, expressive and extensible query language called EdgeQL
* first-class support for schema migrations;
* support for converting arbitrary strictly typed data to and from JSON via a
  simple cast operator;
* out-of-the-box interoperability via REST and GraphQL;
* first-party database clients JavaScript, Go, and Python.


Installing Beta 2
=================

To upgrade to Beta 2, you'll first need need to install the latest version of
our CLI.

**If you already have an version installed**, just run ``edgedb self-upgrade``
to get the latest CLI, then run ``edgedb server upgrade``.

**If you've never used EdgeDB before**, you can install the CLI with a single
command:

.. code-block:: shell

    # macOS/Linux
    $ curl --proto '=https' --tlsv1.2 -sSf https://sh.edgedb.com | sh

    # Windows
    $ iwr https://ps1.edgedb.com/ -useb | iex

Then run ``edgedb server install``.

Once you've got the latest versions of the CLI and EdgeDB, you're ready to get
started. And getting started is easier than ever before!

**Upgrade your instances**

To upgrade an existing EdgeDB instance to Beta 2:

.. code-block:: shell

    $ edgedb server upgrade my_instance

Or upgrade all instances simultaneously:

.. code-block:: shell

    $ edgedb server upgrade


Introducing ``edgedb project``
==============================

The primary new feature of Beta 2 is the addition of ``edgedb project`` to our
CLI and its associated ``edgedb.toml`` config file, which lives in your project
root directory.


Turn any directory on your computer into an "EdgeDB Project" by running
``edgedb project init`` inside it. This command does a lot:

- It scaffolds your project by creating a ``dbschema`` folder and an empty
  ``dbschema/schema.esdl`` inside it (if they don't already exist).
- It prompts you to either create a new EdgeDB instance on your machine or
  specify an existing one that's already running on your computer.
- It creates a **link** between that instance and the current project
  directory. This link is recorded in the ``~/.edgedb/projects`` directory.
- It generates an ``edgedb.toml`` file if it doesn't already exist. This
  identifies the directory as an EdgeDB Project. Check this file into version
  control so it's easy for others to easily spin up a local EdgeDB instance for
  this project.

Once your project is initialized, you no longer need to use connection flags in
CLI commands. Instead of  ``edgedb -I my_instance migrate``, you can simply run
``edgedb migrate`` inside your project directory! 🎉

Plus, you no longer need to provide an instance name or set environment
variables with connection information if you're using one of EdgeDB's
first-party client libraries for `JavaScript/TypeScript
<https://github.com/edgedb/edgedb-js>`_, `Python
<https://github.com/edgedb/edgedb-python>`_, and `Go
<https://github.com/edgedb/edgedb-go>`_). The library automatically detects the
``edgedb.toml`` file and connects to the linked instance automatically.

For a more complete explanation of how to get started with ``edgedb project``,
read the dedicated post: `Introducing EdgeDB Projects
</blog/introducing-edgedb-projects>`_.


Deno support
============

Deno users: you can now use the EdgeDB JS/TypeScript client! It's available for
immediate import on ``deno.land/x``.

.. code-block:: typescript

    import * as edgedb from "https://deno.land/x/edgedb/mod.ts"

    const conn = await edgedb.connect();

    // (for remote instances)
    // const conn = await edgedb.connect(
    //   "edgedb://edgedb@example.com/test"
    // );

    // run a query
    const result = await conn.queryOneJSON(`SELECT 2 + 2;`);
    result; // => 4


Customizable retry logic
========================

Beta 1 introduced best-in-class automatic retrying and transaction logic across
EdgeDBs first-party client libraries for `JavaScript/TypeScript
<https://github.com/edgedb/edgedb-js>`_, `Python
<https://github.com/edgedb/edgedb-python>`_, and `Go
<https://github.com/edgedb/edgedb-go>`_. For more information, read the `Robust
Client API RFC
<https://github.com/edgedb/rfcs/blob/master/text/1004-transactions-api.rst>`_.

Now, we've made every aspect of that logic configurable. You can override the
default transaction & retry settings for your connection pool with the
immutable ``withTransactionOptions`` and ``withRetryOptions`` methods. The
example below uses the TypeScript client but there are equivalent APIs for
Python and Go. Read the docs to learn the syntax for your preferred language.

.. code-block:: typescript

    import * as edgedb from "./index.node";

    async function main() {
      const defaultPool = await edgedb.createPool();

      const retryOptions = new edgedb.RetryOptions(
        5, // defaults to 3
        edgedb.defaultBackoff // (attemptNo: number)=>number
      );

      const transactionOptions = new edgedb.TransactionOptions({
        // defaults to RepeatableRead
        isolation: edgedb.IsolationLevel.Serializable,
        // defaults to false
        readonly: true,
        // defaults to false
        deferrable: true,
      });

      const customizedPool = defaultPool
        .withTransactionOptions(transactionOptions)
        .withRetryOptions(retryOptions);

      await customizedPool.retryingTransaction(async (tx) => {
        await tx.queryJSON(`SELECT User FILTER id = <uuid>`, {});
      });
    }

.. note::
    :class: aside

    **Note:** The ``createPool`` API is deprecated in our latest client
    bindings. It has been replaced with the :js:func:`docs:createClient`
    API, see our :ref:`RC2 blog post <ref_rc2_pool>` for more details.

By default all transactions are executed using the ``RepeatableRead`` isolation
level. You can now customize transactions to run as ``Serializable`` instead,
and explictly mark transactions as readonly or deferrable. Read more about
these terms in the Postgres `Transaction docs
<https://www.postgresql.org/docs/current/sql-set-transaction.html>`_.

You can also specify the max number of retries (defaults to 3) and a custom
exponential backoff function, which defaults to this:

.. code-block:: typescript

    export function defaultBackoff(attemptNo: number): number {
      return 2 ** attemptNo * 100 + Math.random() * 100;
    }


DESCRIBE SCHEMA AS SDL
======================

For instances running EdgeDB 1.0 Beta 2 or later, you can now introspect the
current schema as SDL with the ``DESCRIBE SCHEMA AS SDL`` DDL command. This is
useful if you want to conveniently compare your local schema file(s) to the
instance's current schema state. Just open a repl and run the command:

.. code-block::

    $ edgedb -I my_instance
    edgedb> DESCRIBE SCHEMA AS SDL;
    {
      type default::User {
        required property name -> std:str;
        # ...
      }
    }

    # ...


Start using Beta 2
==================

For a full breakdown of the bug fixes and stability improvements in Beta 2,
check out the full :ref:`Changelog <docs:ref_changelog_beta2>`.

To start playing with EdgeDB, go through the 5-minute :ref:`Quickstart
<docs:ref_quickstart>` or try the `interactive tutorial </tutorial>`_ (no
need to install anything)! We're happy to give assistance and debug issues,
just reach out `on GitHub Discussions
<https://github.com/orgs/edgedb/discussions>`_ or file a `a bug report or a
feature request <https://github.com/edgedb/edgedb>`_.

To keep tabs on future announcements, follow us on Twitter `@edgedatabase
<https://twitter.com/edgedatabase>`_.


.. _github: https://github.com/edgedb/edgedb
.. _tenex: /blog/a-path-to-a-10x-database
.. _bettersql: /blog/we-can-do-better-than-sql
