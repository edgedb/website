.. blog:authors:: colin
.. blog:published-on:: 2022-10-21 12:00 PM PT
.. blog:lead-image:: images/codegen.jpg
.. blog:guid:: c8f9debd-4aef-46da-855d-de7156f62dd6
.. blog:description::
    Execute EdgeQL queries in a typesafe way with code generation.

==============================================
Typesafe database querying via code generation
==============================================

As statically typed languages grow more widespread, so too does a common problem: how does one execute a database query in a typesafe way?

.. note::

  We've just published the ``v1.0`` versions of our client libraries for `JavaScript <https://github.com/edgedb/edgedb-js/releases/tag/v1.0.0>`_ and `Python <pyreleases_>`_, which include the generation features described in this post.

.. _pyreleases: https://github.com/edgedb/edgedb-python/releases


This consideration drives many developers towards using ORM libraries, which provide a subset of the functionality of the underlying query langauge and often come with `performance tradeoffs </blog/why-orms-are-slow-and-getting-slower>`_. However, the ability to write strongly typed queries in a DRY way is often worth the tradeoff.

EdgeDB now supports a mechanism that provides the best of both worlds: typesafe code generated directly from your EdgeQL queries.


Defining typesafety
-------------------

The word "typesafe" means different things to different people, so let's be clear what we mean here. EdgeQL queries can contain parameters—inputs—designated with a ``$`` prefix. They also are statically analyzed by the EdgeDB server, so their expected return type is known ahead of time.

The goal is to provide a mechanism by which queries are *written in EdgeQL* and converted to a "language-native" form such that our statically-typed language of choice—be it TypeScript, Dart, or Python (via dataclasses)— enforces the input types and returns a typed result at compile-time.

Our approach
------------

The natural way to achieve this is to represent our queries as typed functions.

Our official client libraries for JavaScript/TypeScript, Python, and Dart have all been updated to include a mechanism to perform the following steps.

- Detect ``*.edgeql`` files in your project
- Send the contents to the running EdgeDB instance
- Get back rich type descriptions of the queries parameters and return types
- Generate a source file containing an appropriately typed function

.. note::

  Our official ``.NET`` client is coming soon, and will also support this workflow. Stay tuned!

Let's look at the TypeScript workflow for demonstration purposes. Assume a file called ``getMovie.edgeql`` exists in your project directory with the following contents:

.. code-block:: edgeql

  # getMovie.edgeql
  select Movie {
    title,
    release_year
  }
  filter .title = <str>$title


Install the codegen package from NPM, then run the generation command.

.. code-block:: bash

  $ npm install @edgedb/generate -D
  $ npx @edgedb/generate queries

This will generate a file ``getMovies.edgeql.ts`` alongside the ``getMovie.edgeql`` file, containing the following fully-typed function:

.. code-block:: typescript

  import type {createClient} from "edgedb";

  async function getMovie(
    client: Client,
    params: {title: string}
  ): Promise<{ title: string; release_year: number | null }> {
    return client.querySingle(`
      select Movie {
        title,
        release_year
      }
      filter .title = <str>$title
    `, params);
  }

This generated "query function" can be imported and used in your application
like so:

.. code-block:: typescript

  import {getMovie} from "./getMovie.edgeql.ts"; // importing

  const movie = await getMovie(client, {
    title: "Avengers: The Kang Dynasty"
  });

Workflow
--------

Support for code generation from query files has been added to our client libraries for JavaScript/TypeScript, Python, and Dart. Different language ecosystems provide different idioms and mechanisms for code generation, so the precise workflow varies.

First, :ref:`initialize a project <ref_quickstart>` and install the client library for your chosen language, plus any additional dependencies.

.. tabs::

  .. code-tab:: bash
    :caption: Node.js

    $ yarn add edgedb
    $ yarn add @edgedb/generate -D  # dev dependency

  .. code-tab:: bash
    :caption: Deno

    $ n/a

  .. code-tab:: bash
    :caption: Python

    $ pip install edgedb # must be 1.0 or later!

  .. .. code-tab:: bash#Go

  ..   $ go get github.com/edgedb/edgedb-go
  ..   $ go install github.com/edgedb/edgedb-go/cmd/edgeql-go@latest

  ..   code-tab:: bash
    :caption: Dart

    $ dart pub add edgedb
    $ dart pub add --dev build_runner

Then run the code generator. For each detected ``*.edgeql`` file, an appropriate source file will be generated alongside it. For instance a file ``getMovie.edgeql`` will result in ``getMovie.edgeql.ts``.

- As needed, certain generators support multiple targets, such as ``--target {async|blocking}`` in ``edgedb-python``.
- Where possible, some generators support a "single-file mode" in which all query functions are aggregated into a single generated file.
- Where possible, some generators support a "watch mode" that listens for changes to ``*.edgeql`` files and regenerates the source files as needed.

.. tabs::

  .. code-tab:: bash
    :caption: Node.js

    $ npx @edgedb/generate queries
    $ npx @edgedb/generate queries --file  # all functions in a single file

  .. code-tab:: bash
    :caption: Deno

    $ deno run --allow-all --unstable https://deno.land/x/edgedb/generate.ts queries
    $ deno run --allow-all --unstable https://deno.land/x/edgedb/generate.ts queries --file  # all functions in a single file

  .. code-tab:: bash
    :caption: Python

    $ edgedb-py
    $ edgedb-py --target {async|blocking|pydantic} # async is the default
    $ edgedb-py --file  # all functions in a single file


  .. .. code-tab:: bash#Go

  ..   $ go:generate edgeql-go

  ..   code-tab:: bash
    :caption: Dart

    $ dart run build_runner build
    $ dart run build_runner watch # watch mode


For specifics for your preferred language, refer to the library-specific documentation below.

- :ref:`TypeScript <edgedb-js-queries>`
- :ref:`Python <edgedb-python-codegen>`
- `Dart </docs/clients/dart/codegen>`_


.. - `Go <https://github.com/edgedb/edgedb-go/pull/236/files>`_


Third-party code generators
---------------------------

As part of a larger effort towards encouraging codegen-based workflows, our JavaScript/TypeScript client now exposes a set of tools to make it easier to build your own third-party code generators. The ``*.edgeql`` workflow described here and our :ref:`TypeScript query builder <edgedb-js-qb>` are both implemented using this same set of tools.

After installing ``edgedb@1.x+`` from NPM, use the ``$`` variable to access these tools.

.. code-block:: typescript

  import {$, createClient} from "edgedb";

  const client = createClient();

  // get the TS representation of a query's parameters and result type
  await $.analyzeQuery(client, `<query here>`);

  // introspect the entire typesystem
  await $.introspect.types(client);

  // additional introspection tools
  await $.introspect.functions(client);
  await $.introspect.operators(client);
  await $.introspect.casts(client);
  await $.introspect.scalars(client);

.. note::

  For advanced use cases, you can fall back to hand-writing :ref:`introspection queries <ref_datamodel_introspection>`. The ``$.introspect`` tools are just a convenient wrapper around these queries that provide a fully typed result.

Use the information returned by these tools to generate whatever source code you need: React hooks, GraphQL resolvers, Zod schemas, etc. If you build a generator, let us know on our Discord so we can list it in on the `Generators </docs/clients/js/generation>`_ page!
