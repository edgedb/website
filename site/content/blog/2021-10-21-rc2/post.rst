.. blog:authors:: colin
.. blog:published-on:: 2021-11-12 01:00 PM PT
.. blog:lead-image:: images/blog_rc2.jpg
.. blog:guid:: 5a020eba-d2f6-4fca-b50b-e22b30853d18
.. blog:description::
    EdgeDB 1.0 Release Candidate 2 is now available. Bugs are fixed,
    documentation is polished, and our client libraries get a facelift.

==========================
EdgeDB Release Candidate 2
==========================

The second release candidate of EdgeDB 1.0 is now available! Now is the time to
start building cool stuff with EdgeDB! Production-readiness is right around the
corner.

.. note::

  To stay apprised of future releases, follow `@edgedatabase
  <https://twitter.com/edgedatabase>`_ on Twitter or star the `EdgeDB repo
  <https://github.com/edgedb/edgedb>`_ on GitHub.

Introducing *Lacaille*
======================

As always, this release is named after a nearby star. This time it's `Lacaille
<https://en.wikipedia.org/wiki/Lacaille_9352>`_—a red dwarf about 10.74
lightyears from Earth. It's named after
`Nicolas-Louis de Lacaille <https://en.wikipedia.org/wiki/Nicolas-Louis_de_Lacaille>`_,
a prolific French astronomer who named 17 IAU-recognized constellations,
second only to Ptolemy's 47.

We've been hard at work squashing bugs and streamlining developer workflows.
Click a link below to jump to the relevant section.

- :ref:`What is EdgeDB? <ref_rc2_whats_edgedb>`
- :ref:`A simplified client API <ref_rc2_pool>`
- :ref:`Retrying transactions by default <ref_rc2_retry_neterr>`
- :ref:`Idle connection cleanup <ref_timeouts>`
- :ref:`Observability with Prometheus <ref_observability>`
- :ref:`A new memory scalar <ref_cfg_memory>`
- :ref:`Improved local Docker workflow <ref_docker>`
- :ref:`Standardized connection behavior <ref_rc2_standard_cxn>`


.. _ref_rc2_whats_edgedb:

What is EdgeDB?
===============

If you haven't heard of EdgeDB yet, it's a next-generation `open source
<github_>`_ object-relational database with an obsessive focus on developer
experience. Featuring:

* a strict, robust typesystem
* object-oriented schema modeling with multiple
  inheritance, key-less relations, computed properties, JSON support, and more
* a next-generation query language called `EdgeQL </showcase/edgeql>`_,
  featuring JOIN-less deep fetching, composable subquerying, and an extensive
  standard library
* performant, first-party database clients for `JavaScript/TypeScript
  <https://github.com/edgedb/edgedb-js>`_,
  `Python <https://github.com/edgedb/edgedb-python>`_, and
  `Go <https://github.com/edgedb/edgedb-go>`_
* a binary protocol for blazing fast querying
* a unified developer experience via our comprehensive ``edgedb`` CLI, which
  can manage instances, create and apply migrations, and open a shell to local
  or remote instances
* built-in REST and GraphQL query and mutation endpoints

And plenty more. Our goal is to modernize every aspect of the database
developer experience. Check out the :ref:`10-minute quickstart <docs:ref_quickstart>` to
learn more.

.. _ref_rc2_installation:

Upgrading/installation
----------------------

To get started, install the latest version of our CLI.

For first-time users:
^^^^^^^^^^^^^^^^^^^^^

Go through our 10-minute :ref:`Quickstart <docs:ref_quickstart>`; it'll walk you through
the process of installing EdgeDB, spinning up an instance, creating/executing a
migration, and running your first query.

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

.. _ref_rc2_pool:

A simplified client API
=======================

Previously, our client libraries made a distinction between an individual
``Connection`` and a connection ``Pool``. This is a common convention in
language bindings for other databases. When we designed our client APIs, we
chose to conform to this convention.

.. code-block:: typescript

  import * as edgedb from "edgedb";

  async function run(){
    const conn = await edgedb.connect(); // Connection
    const pool = await edgedb.createPool(); // Pool
  }

But that decision didn't sit well with us. In modern backend development,
`connection pooling <https://en.wikipedia.org/wiki/Connection_pool>`_ is a best
practice. Your API throughput should never be bottlenecked by the capacity of
single physical connection to your database. Moreover, there's no practical
difference between a single "raw" connection  and a connection pool of size
one. Why bother with two separate concepts?

We decided there's no good reason. So we're introducing a new abstraction: the
*client*.


A standard API
--------------

All EdgeDB client libraries have been updated to support a single, unified
API for initializing clients.

With the `TypeScript/JS <https://github.com/edgedb/edgedb-js>`_ library:

.. code-block:: typescript

  import * as edgedb from "edgedb";
  const client = edgedb.createClient();

  // later
  await client.querySingle(`select "hello world!"`);

With the `Python <https://github.com/edgedb/edgedb-python>`_ client library:

.. code-block:: python

  import edgedb
  client = edgedb.create_async_client('my_name')

  # later
  await client.query_single('select "hello world!"');

With the `Go <https://github.com/edgedb/edgedb-go>`_ client library:

.. code-block:: go

  ctx := context.Background()
  client, err := edgedb.CreateClient(ctx, opts)

  // later
  var result string
  err = client.QuerySingle(ctx, "select 'hello world!'", &result)


Lazy clients
------------

Previously, ``Connections`` and ``Pools`` eagerly initialized a connection; the
``connect`` and ``createPool`` functions waited for a connection to be
established before they could be used to execute queries. (In JavaScript, this
was represented with a *Promise*; in Python, it was an *awaitable*.)

Since clients are now lazy, the ``createClient`` function returns
instantaneously. A physical database connection will be established behind the
scenes the first time you execute a query. This makes it easy to configure a
client and share it among several files.

.. code-block:: typescript

  // connection.js
  import * as edgedb from "edgedb";

  export const client = edgedb.createClient()

  // api.js
  import { client } from "./connection.js"

  async function endpoint() {
    const result = await client.query(`select 2 + 2;`);
    console.log(result);
  }

In cases where you want to validate if the connection can be established
to check for connection errors you can use the new ``ensureConnected()``
method:

.. code-block:: typescript

  export const client = edgedb.createClient()

  async function endpoint() {
    await client.ensureConnected();
    // ...
  }


Concurrency
-----------

Clients maintain a connection pool internally; as such, they can execute
several queries concurrently. In the example below, each of the five queries
will be executed using a different physical database connection.

.. code-block:: typescript

    import * as edgedb from "edgedb";

    async function main() {

      const client = edgedb.createClient();

      const results = await Promise.all([
        client.querySingle(`select 0`),
        client.querySingle(`select 1`),
        client.querySingle(`select 2`),
        client.querySingle(`select 3`),
        client.querySingle(`select 4`),
      ]);
      // [0, 1, 2, 3, 4]
    }

Configuring ``concurrency``
---------------------------

By default, the number of possible connections managed by a client is ``100``.
Previously, this value was hard-coded into the client libraries. As of RC2,
this value is fetched as a "server hint" from the EdgeDB instance upon
initial connection.

To override the default, pass a ``concurrency`` parameter to ``createClient``.
Passing a value of ``1`` guarantees that all queries are executed on a single
connection, similar to a conventional database ``Connection`` object.

.. code-block:: typescript

    import * as edgedb from "edgedb";

    const client = edgedb.createClient({ concurrency: 1 });


.. _ref_rc2_retry_neterr:

Retrying transactions by default
================================

On the theme of next-generation client libraries, let's talk about transactions.

EdgeDB's client libraries include the concept of a "retrying transaction";
such transactions detect when "retryable" errors occur, roll back the current
attempt, and try again. The delay between successive attempts is `increased
exponentially <https://en.wikipedia.org/wiki/Exponential_backoff>`_ until a
maximum number of attempts is hit.

Retrying safely
---------------

While the concept of retrying a transaction may seem dubious at first, it's
implemented safely, taking advantage of EdgeDB's detailed error reporting
system. Retries are only attempted if the previous attempt is *guaranteed* to
have failed *for an ephemeral reason*.

If a query fails due to a short-lived issue—say, a transaction deadlock or a
network error—it will be retried; invalid queries will not. Retryable
transactions increase the robustness and reliability of your backend, no extra
work required.

To the best of our knowledge, such a pattern doesn't exist in any other major
database client library. We think this is the future of client transactions.

Updating the API
----------------
Despite our confidence in this concept, we previously made a distinction
between "raw" and "retryable" transactions.

.. code-block:: typescript

  const conn = edgedb.connect();

  await conn.rawTransaction(async tx => {
    // do stuff
  });

  await conn.retryingTransaction(async tx => {
    // do stuff
  });


But, like the "connection vs pool" distinction, this didn't sit well with us.
We believe retryable transactions represent the new best practice for modern
database-based applications; to reflect this, we're renaming
``retryingTransaction`` to merely ``transaction``.

.. code-block:: typescript

  const client = edgedb.createClient();

  await client.transaction(async tx => {
    // do stuff
  });

The ``rawTransaction`` method has been removed; to simulate the old behavior,
set the maximum number of attempts to ``1``. The ``retryingTransaction`` method
has been deprecated and will be removed in a future release.

.. code-block:: typescript

  import * as edgedb from "edgedb";

  const client = edgedb.createClient();

  await client
    .withRetryOptions({attempts: 1})
    .transaction(async tx => {
      // this transaction will not be retried
    });

.. Network errors are now retryable
.. --------------------------------

.. No network is perfect; one of the most common reasons for ephemeral query
.. failures are *network errors*. As of RC2, all client libraries treat network
.. errors as "retryable". To learn more about how EdgeDB libraries handle
.. transaction retries, check out the
.. `Client API RFC <https://github.com/edgedb/rfcs/blob/master/text/1004-transactions-api.rst>`_.



.. _ref_timeouts:

Idle connection cleanup
=======================

We've implemented three mechanisms to automatically clean up idle connections
and hanging transactions.

Configuring ``session_idle_timeout``
------------------------------------

Most databases don't automatically close idle connections to avoid causing
unexpected query failures in poorly designed clients. Over time, these idle
connections can accumulate, eventually hitting the connection limit of your
database.

By contrast, EdgeDB can now close idle connections proactively. Even better,
this won't result in frequent query failures; EdgeDB's first-party client
libraries are designed to handle network errors gracefully by re-establishing a
connection and re-attempting the query.

Configure this behavior with the global ``session_idle_timeout`` configuration
option. It accepts a value of type :ref:`duration
<docs:ref_datetime_duration>`. A value of ``<duration>"0"`` will disable the
mechanism; the default is *60 seconds*.

Configuring ``session_idle_transaction_timeout``
------------------------------------------------

The ``session_idle_transaction_timeout`` setting places a cap on how long a
client connection can be idle *during a transaction*. This prevents
long-running transactions or client-side bugs from causing long-term deadlocks
and performance issues. When the timeout is reached, the transaction is aborted
and rolled back.

Currently this is a global setting, but we plan to provide a way to set it on a
per-session basis shortly. It expects a ``std::duration``. A value of
``<duration>"0"`` will disable this mechanism; the default is *10 seconds*.

Configuring ``query_execution_timeout``
---------------------------------------

This setting configures the maximum allowable execution time for any query.
Once this timeout is reached, EdgeDB will cancel the query and return an error.
To configure this behavior, set ``query_execution_timeout``; it expects a
``std::duration``. By default, the value is ``<duration>"0"``, which disables
the mechanism.



.. _ref_observability:

Observability with Prometheus
=============================

EdgeDB instances now expose a Prometheus-compatible ``/metrics`` endpoint to
provide observability into resource usage, performance, and error rates,
including:

- The total and current number of spawned compiler processes.
- The total and current number of connections to the backend Postgres instance
  or cluster.
- The total and current number of incoming connections from clients.
- A histogram of query compilation and execution times.
- Several more — the full set of available metrics is documented in the
  :ref:`Observability <docs:ref_observability>` page.

To inspect these metrics, construct your instance's Prometheus URL by appending
``/metrics`` to its address—for example,
``http://db.domain.com:5656/metrics``. Plug this into your Prometheus instance.

.. _ref_cfg_memory:

A new scalar type ``cfg::memory``
=================================

EdgeDB exposes several memory configuration settings of the underlying Postgres
database, including ``query_work_mem``, ``shared_buffers``, and
``effective_cache_size``. Previously these values were represented with simple
strings; however to represent these settings (and any future memory settings)
safely and explicitly, we've implemented a new scalar type: ``cfg::memory``.

As with ``uuid``, ``datetime``, and several other types, ``cfg::memory`` values
are declared by casting from an appropriately formatted string.

.. code-block:: edgeql-repl

  db> select <cfg::memory>'1B'; # 1 byte
  {<cfg::memory>'1B'}
  db> select <cfg::memory>'5KiB'; # 5 kibibytes
  {<cfg::memory>'5KiB'}
  db> select <cfg::memory>'128MiB'; # 128 mebibytes
  {<cfg::memory>'128MiB'}
  db> select cfg::Config{session_idle_timeout, shared_buffers};
  {cfg::Config {
    session_idle_timeout: <duration>'0:00:00',
    shared_buffers: <cfg::memory>'128MiB'
  }}



.. _ref_docker:

Improved local Docker workflow
==============================

Some users prefer to run EdgeDB in Docker container while developing locally,
in an effort to standardize their development and production workflows. This
approach is possible, but creates some friction with the recommended CLI-based
workflows.

Local credentials in EdgeDB
---------------------------

When you create a local EdgeDB instance with the CLI, EdgeDB stores its
credentials in your file system. These credentials are then read by the CLI and
client libraries when attempting connection to a local instance.

.. note::

  The precise location where these credentials are stored varies based on
  your operating system; run ``edgedb info`` to view the absolute system paths
  EdgeDB uses.

Since Docker-based instances run in a sandboxed container, their credentials
aren't stored in a place that's findable by the clients. To work around this
issue and make local Docker-based development possible, we're providing an easy
way to disable most of EdgeDB's security features. To that end, we're
introducing two new environment variables: ``EDGEDB_SERVER_SECURITY`` and
``EDGEDB_CLIENT_SECURITY``.

``EDGEDB_SERVER_SECURITY``
    This variable is intended for use in the server (Docker) environment, as
    indicated by the ``EDGEDB_SERVER_`` prefix; set this variable in your
    ``docker-compose.yml`` file, It configures the "security mode" of all
    instances initialized in the environment. The two allowable values are
    ``strict`` (the default) and ``insecure_dev_mode``. With
    ``EDGEDB_SERVER_SECURITY=insecure_dev_mode`` in the server environment, all
    created EdgeDB instances will disable password-based authentication and
    allow unencrypted HTTP traffic.

``EDGEDB_CLIENT_SECURITY``
  This variable is intended for use in the client environment: wherever you
  plan to use a client library or the CLI. This variable sets the security mode
  for EdgeDB clients, like the CLI and the client libraries. The two allowable
  values are ``strict`` (the default) and ``insecure_dev_mode``. With
  ``EDGEDB_CLIENT_SECURITY=insecure_dev_mode``, all clients will trust
  self-signed TLS certificates.

You should set both variables to develop locally with Docker.


.. _ref_rc2_standard_cxn:

Standardized connection behavior
================================

There are several mechanisms for configuring a connection to an EdgeDB
instance, whether using a client library or the CLI.

- You need to specify *what instance* to connect to, with an :ref:`instance
  name <docs:ref_reference_connection_instance_name>`, :ref:`DSN
  <docs:ref_dsn>`, or credentials file.
- Depending on how you specify an instance, it may be necessary to separately
  provide a username, password, database name, or TLS settings.
- Moreover, all these settings can be provided to the client explicitly (say,
  passed as an argument to ``createClient``) or via environment variables.

But what happens if you specify multiple conflicting connection methods? What
is the relative priority of environment variables vs explicit parameters? In
RC2 we've established a standard resolution algorithm that answers these
questions and implements it uniformly across the CLI and all client libraries.
Here's a simple breakdown:

- There are three "priority levels". From highest to lowest priority: 1)
  explicit connection parameters, 2) environment variables, 3)
  :ref:`project-linked <ref_guide_using_projects>` connections.
- Connection information specified in a higher priority level overrides *any
  and all* connection information from lower levels.
- Ambiguity within a given priority level is not allowed. For instance,
  specifying both ``EDGEDB_DSN`` and ``EDGEDB_INSTANCE`` environment variables
  will throw an error.
- So-called "granular parameters" (username, password, database, and TLS
  settings) can override individual components of non-granular parameters (e.g.
  DSNs) specified at the *same or lower* priority level. For instance,
  ``EDGEDB_USER`` will override a username specified within ``EDGEDB_DSN``, but
  will have no effect when using ``--dsn`` (since ``--dsn`` takes priority).

This standardized resolution algorithm is implemented across all client
libraries and the CLI. For a full breakdown of the algorithm, consult
:ref:`Connection Parameters <docs:ref_reference_connection>`.


Wrapping up
===========

For a full breakdown of the bug fixes and stability improvements in RC2,
check out the full :ref:`Changelog <docs:ref_changelog_rc2>`. To keep tabs on
future announcements, follow us on Twitter `@edgedatabase
<https://twitter.com/edgedatabase>`_ or
`GitHub <https://github.com/edgedb/edgedb>`_!

Looking to learn more about EdgeDB?

* If you're just starting out, go through 10-minute :ref:`Quickstart guide
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
