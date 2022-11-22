.. blog:authors:: james
.. blog:published-on:: 2022-09-29 11:00 AM PT
.. blog:lead-image:: images/dart.jpg
.. blog:guid:: 62d108fd-b558-4d21-92fc-6d1787004822
.. blog:description::
    Today we're excited to announce an official
    client library for the Dart language.

=============
EdgeDB + Dart
=============

Today we are releasing an official client library for the Dart language, making
it the latest to join our expanding collection of first-party libraries for
JavaScript, TypeScript, Deno, Python, Go, and Rust.

Give it a star on `GitHub <https://github.com/edgedb/edgedb-dart>`_, checkout
the :ref:`docs <docs:ref_client_dart>`, and join our
`Discord <discord.gg/edgedb>`_ to discuss!

:blog:github-button:`href:https://github.com/edgedb/edgedb-dart|size:huge|title:Star edgedb-dart!`

.. note::
    :class: aside

    In other news, our `.NET client <https://github.com/edgedb/edgedb-net>`_
    is about to graduate to a production-ready library. Stay tuned for the
    upcoming announcement!

Users of EdgeDB will immediately feel familiar with the Dart client.
It has the same zero-config ``createClient()`` connection API. Connection
pooling is built-in and is fully automatic. Queries and transactions
retry on network and transaction errors. And the best news is that all of
this comes with great ergonomics and DX.


What is EdgeDB?
---------------

For the fellow Dartisans who are new to EdgeDB, here is a short overview of
its killer features:

* Modern, lean query language designed to surpass SQL in expressive power;
* Rich type system;
* A declarative schema which lets you express inheritance, computed properties,
  functions, complex constraints, access control rules;
* A builtin migration system that can reason and diff schemas automatically
  or interactively;
* Powered by PostgreSQL.


Getting started
---------------

Before you can get started with using the Dart client, you're going to need an
EdgeDB instance for your project. If you don't already have one setup, we have
a complete :ref:`Quickstart guide <docs:ref_quickstart>` that will walk you
through the process, but really it's as simple as installing the
`EdgeDB CLI tool <https://www.edgedb.com/install>`_ with one ``curl`` command,
running ``edgedb project init`` in your project directory,
and following a couple of prompts.

Once that's done, you'll need to add the ``edgedb`` Dart package to your
dependencies:

.. code-block:: bash

  $ dart pub add edgedb

then import it into your app:

.. code-block:: dart

  import 'package:edgedb/edgedb.dart';

Congrats! 🎉 Now you're ready to run your first query in Dart:

.. code-block:: dart

  final client = createClient();

  void main() async {
    print(
      await client.query('select "Hello Dart!"')
    );
  }

As with all our client libraries, the ``Client`` class is the main
interface of the library. It provides methods to run queries, handles
configuration of session state (e.g. globals), and automatically manages
and scales an internal pool of network connections to the database server.

To create a ``Client`` we use the ``createClient()`` function which, as you may
have noticed, is typically called without any arguments. When a Dart app
is run from an EdgeDB project directory, ``createClient()`` will
automatically find the database server to connect without any further
configuration needed.

Obviously for a database to be useful, you'll need a schema and some data.
In the following examples we're going to use our usual "Movies" example
database. The actual schema and sample data can be found in the
`example <https://github.com/edgedb/edgedb-dart/tree/main/example>`_
directory of the edgedb-dart repo.

Let's try a more complicated query to show off some of EdgeDB's features:

.. code-block:: dart

  void main() async {
    final movies = await client.query(r'''
      select Movie {
        title,
        release_year,
        actors: {
          name,
          @character_name,
        }
      } filter .actors.name = <str>$name''',
      {'name': 'Ben Kingsley'}
    );

    print(movies);
  }

If you are following along in your IDE, you'll notice that the
return type of the query is just ``List<dynamic>``. Similarly, the query
``args`` parameter allows any type and is only checked at runtime.

One of EdgeDB's key strengths is that your schema and EdgeQL queries are
statically type checked, as is Dart itself. Wouldn't it be be useful if we
could get our query results to be type safe as well? Luckily there is an
answer.

Codegen
-------

Dart has an idiomatic way for codegen in the form of the
`build_runner <https://pub.dev/packages/build_runner>`_ library. It's used
by many popular packages, such as
`json_serializable <https://pub.dev/packages/json_serializable>`_, to generate
fully type-safe interfaces without having to manually define all the types
yourself.

The ``edgedb`` package comes with its own ``Builder`` for Dart's
`build_runner <https://pub.dev/packages/build_runner>`_, that out of the box
will generate fully typed extension methods on the ``Client`` class for all
the ``.edgeql`` files in your project. Let's see an example of how it works.

First you'll need to add the ``build_runner`` dependency to your project
and start the build runner in watch mode:

.. code-block:: bash

  $ dart pub add --dev build_runner

  $ dart run build_runner watch

Now let's copy the above "movies" query into its own ``.edgeql`` file.
``build_runner`` will then automatically generate a corresponding ``.edgeql.dart``
file, which will contain a fully typed query method. All that's left to
do is to import that generated file into your app, and use the new
query method on ``Client`` named after the ``.edgeql`` filename:

.. tabs::

  .. code-tab:: dart
    :caption: app.dart

    import 'package:edgedb/edgedb.dart';
    import 'getMoviesStarring.edgeql.dart';

    void main() async {
      final movies = await client.getMoviesStarring(
        name: 'Ben Kingsley'
      );

      for (var movie in movies) {
        print('Title: ${movie.title}\n'
            'Release Year: ${movie.release_year}\n'
            'Cast:\n${movie.actors.map(
              (actor) =>
                '  ${actor.$character_name}: ${actor.name}'
            ).join('\n')}\n');
      }
    }

  .. code-tab:: edgeql
    :caption: getMoviesStarring.edgeql

    select Movie {
      title,
      release_year,
      actors: {
        name,
        @character_name,
      }
    } filter .actors.name = <str>$name

Naturally the ``.getMoviesStarring()`` method accepts a properly typed
named argument for the query parameter ``name`` and returns a fully typed
result object.

.. note::
    :class: aside

    If you're surprised why the the link property ``@character_name`` became
    ``$character_name`` in the return type, it's because the ``@`` character cannot
    be used in Dart identifiers. See the `codegen docs </docs/clients/dart/codegen>`_
    for other similar cases to be aware of.

All the examples in this blog post have been just using the Dart SDK, but
edgedb-dart will also work in your Flutter app. Take a look at the example in
the `edgedb-examples repo <https://github.com/edgedb/edgedb-examples>`_ for
a basic setup for using edgedb-dart with Flutter.

Wrapping up
-----------

We hope you'll enjoy the EdgeDB + Dart combo. Please let us know how it
goes on the `edgedb-dart <https://github.com/edgedb/edgedb-dart>`_ GitHub. ❤️

Last, but not least, the Dart client is only the first to get built-in support
for codegen. We will soon be updating all of our client libraries
to have it available out of the box. Stay tuned for the updates!

