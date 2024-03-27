.. blog:authors:: quin
.. blog:published-on:: 2022-11-01 11:00 AM PT
.. blog:lead-image:: images/dotnet.jpg
.. blog:guid:: debf6b05-5ce6-472d-a2dc-0129cb0d59a9
.. blog:description::
    Today we're excited to announce an official
    client library for the .NET ecosystem.

=======================
Bringing .NET to EdgeDB
=======================

Today, we're excited to announce the official .NET binding for EdgeDB!

I crafted the first version of the library a few months ago. Since then
I've been working closely with(in) the EdgeDB team to fine-tune
the implementation and the API to make it an idiomatic EdgeDB client.

Remember to give EdgeDB.Net a ⭐️ on `GitHub <https://github.com/edgedb/edgedb-net>`_,
check out the :ref:`docs <docs:edgedb-dotnet-intro>`, and join our
`Discord`_!

:blog:github-button:`href:https://github.com/edgedb/edgedb-net|size:huge|title:Star edgedb-net!`

What makes a good EdgeDB client
-------------------------------

All EdgeDB clients share a certain design approach and philosophy that the new
.NET client also embraces. In short,
:ref:`all EdgeDB clients <docs:ref_clients_index>` should:

* implement zero-config connectivity, ensured by passing the shared set of
  `connection tests <https://github.com/edgedb/shared-client-testcases>`_;
* automatically (and when it's safe!) reconnect on network errors and retry on
  transaction serialization errors;
* be as efficient as possible: lean and mean data serialization and protocol
  implementation;
* abstract away the complexity of client-side connection pooling;
* and, most importantly, the API should be easy to pick up and be
  productive with in no time!

As usual, we've built EdgeDB.Net with performance and developer experience
as our highest priorities. EdgeDB.Net achieves this by using a fully
asynchronous implementation, making use of high-performance .NET design
patterns like `Span<T>`_.

Getting started
---------------

To follow along with this demo you will need EdgeDB 🚀.
If you are new to EdgeDB you can follow our
:ref:`quickstart guide <docs:ref_quickstart>` to get EdgeDB installed
and ready.

.. note::

   Make sure that you create the EdgeDB project in your ``.sln`` directory.
   This is to ensure that EdgeDB.Net can automatically configure things.
   Also keep in mind that the ``EdgeDB.Net`` package targets .NET 6.

Once you have EdgeDB running, install the new driver with the ``dotnet``
command in your terminal:

.. code-block:: bash

   $ dotnet add package EdgeDB.Net.Driver

A basic client
**************

With the driver installed, you can create a client connection instance
with EdgeDB with `EdgeDBClient`_:

.. tabs::

  .. code-tab:: csharp

    using EdgeDB;

    var client = new EdgeDBClient();

  .. code-tab:: fsharp

    open EdgeDB;

    let client = new EdgeDBClient()

  .. code-tab:: cs
    :caption: DI

    using EdgeDB;

    ...

    services.AddEdgeDB()

To learn more, read our :ref:`.NET quickstart docs <docs:edgedb-dotnet-basic-usage>`.

Your first query
****************

Now you are ready to run your first query:

.. tabs::

  .. code-tab:: csharp

    var result = await client
        .QuerySingleAsync<string>("select 'Hello, .NET!'");

    Console.WriteLine(result);

  .. code-tab:: fsharp

    let! result = client.QuerySingleAsync<string>(
        "select 'Hello, .NET!'"
    )

    printf "%s" result

Note that EdgeDB.Net uses the common .NET value types to represent different
scalar types in EdgeDB. To see the full type mapping table, check out the
:ref:`datatypes <docs:edgedb-dotnet-datatypes>` section in our docs.

Advanced data modeling
----------------------

EdgeDB.Net fully embraces strict typing, allowing you to define concrete
types to represent query results. Yet one of the key features of EdgeDB.Net
is that it supports *polymorphism* of EdgeDB types in .NET.

Abstract types defined in EdgeDB schema can be modeled by abstract types in
your .NET code. You can then pass an abstract type as a query result and
EdgeDB.Net will automatically deserialize data into the correct .NET type.

Let's first create the .NET types which will map to the types
defined in our classic example Movies schema:

.. tabs::

  .. code-tab:: sdl
    :caption: EdgeDB Schema

    module default {
      abstract type Content {
        required property title -> str;
        multi link actors -> Person {
          property character_name -> str;
        };
      };

      type Person {
        required property name -> str;
        link filmography := .<actors[is Content];
      };

      type Movie extending Content {
        property release_year -> int32;
      };

      type Show extending Content {
        property num_seasons := count(.<show[is Season]);
      };

      type Season {
        required link show -> Show;
        required property number -> int32;
      };
    }

  .. code-tab:: csharp
    :caption: Schema in C#

    public abstract class Content
    {
        public string? Title { get; set; }
        public Person[] Actors { get; set; }
    }

    public class Person
    {
        public string? Name { get; set; }
        public Content? Filmography {  get; set; }

        [EdgeDBProperty("@character_name")]
        public string CharacterName { get; set; } // link property
    }

    public class Movie : Content
    {
        public int ReleaseYear { get; set; }
    }

    public class Show : Content
    {
        public long NumSeasons { get; set; }
    }

    public class Season
    {
        public Show Show { get; set; }
        public int Number { get; set; }
    }

  .. code-tab:: fsharp
    :caption: Schema in F#

    type Person = { 
        Name: string; 
        [<EdgeDBProperty("@character_name")>] 
        CharacterName: string;
    }

    type Movie = {
        ReleaseYear: int;
        Title: string;
        Actors: Person[];
    }

    type Show = {
        NumSeasons: int64;
        Title: string;
        Actors: Person[];
    }

    type Season = {
        Show: Show;
        Number: int;
    }

    type Content = 
        | Movie of Movie
        | Show of Show

.. note::

  This demo uses a PascalCase naming strategy in .NET types. This strategy is
  optional and not enabled by default. To learn more about naming strategies and
  how to enable implicit conversion to your chosen strategy, refer to the
  :ref:`Naming Strategy docs <edgedb-dotnet-naming-strategy>`.

We can now query our database with the ``Content`` type for the result:

.. tabs::

  .. code-tab:: cs

    using System.Linq

    var content = await client.QueryAsync<Content>(
        @"select Content {
            title,
            actors: {
                name,
                @character_name
            }
          }
        "
    );

    var movies = content.Where(x => x is Movie);
    var shows = content.Where(x => x is Show);

  .. code-tab:: fsharp

    open System.Linq

    let! content = client.QueryAsync<Content>(
      """select Content {
             title,
             actors: {
                 name,
                 @character_name
             }
         }
      """)

    let movies = content.Where(fun x -> match x with Movie -> true | _ -> false)
    let shows = content.Where(fun x -> match x with Show -> true | _ -> false)

By querying with the ``Content`` abstract type, EdgeDB.Net will return every
``Content`` object—whether it's a ``Movie`` or ``Show``—deserialized as
the corresponding .NET type based on their typename.

To learn more about query result and custom types, check out the
:ref:`Custom Types <docs:edgedb-dotnet-custom-types>` documentation.

Transactions
------------

EdgeDB.Net supports transactions out of the box, retrying your queries if
a retryable error (e.g. a network failure) occurs. If an non-retryable error
happens, the queries performed within the transactions are automatically rolled
back.

.. tabs::

  .. code-tab:: csharp

    var result = await client.TransactionAsync(async (tx) =>
    {
        return await tx.QueryRequiredSingleAsync<string>(
            "select 'Hello, .NET!'"
        );
    });

    Console.WriteLine(result);

  .. code-tab:: fsharp

    let! result = client.TransactionAsync(fun tx ->
        tx.QueryRequiredSingleAsync<string>("select 'Hello, .NET!'")
    )

    printf "%A" result

.. note::

  Code blocks in transactions may run multiple times. It's good practice
  to only perform safe to re-run operations in transaction blocks.

State API
---------

EdgeDB.Net allows to configure state by using the ``With*()`` family of methods.
This allows creating clients with different state configuration while
efficiently sharing the same underlying client pool.

.. note::

  ``With*`` methods will always return a *new* client instance, which contains
  the applied state changes.

This is incredibly useful in tandem with :ref:`Globals <docs:ref_datamodel_globals>`
and :ref:`Access Policies <docs:ref_datamodel_access_policies>`. Let's use the
demo from the access policy docs as an example:

.. tabs::

  .. code-tab:: csharp

    // An example UUID; you should use a real one from your DB!
    var userId = Guid.NewGuid();

    var scopedClient = client
        .WithGlobals(new Dictionary<string, object?>
        {
            { "current_user_id", userId }
        });

    var posts = scopedClients.QueryAsync<BlogPost>(
        "select Post { title }"
    );

  .. code-tab:: fsharp

    // An example UUID; you should use a real one from your DB!
    let userId = Guid.NewGuid()

    let scopedClient = client.WithGlobals(
        dict [ "current_user_id", userId ]
    )

    let! posts = scopedClients.QueryAsync<BlogPost>(
        "select Post { title }"
    )

State API also allows configuring client behavior with extreme granularity:

.. tabs::

  .. code-tab:: csharp

    using EdgeDB.State;

    var configuredClient = client
        .WithConfig(conf =>
        {
            conf.AllowDMLInFunctions = true;
            conf.ApplyAccessPolicies = true;
            conf.DDLPolicy = DDLPolicy.AlwaysAllow;
            conf.QueryExecutionTimeout = TimeSpan.FromSeconds(10);
            conf.IdleTransationTimeout = TimeSpan.FromSeconds(10);
        })

  .. code-tab:: fsharp

    open EdgeDB.State

    let configuredClient = client.WithConfig(fun conf ->
        conf.AllowDMLInFunctions <- true
        conf.ApplyAccessPolicies <- true
        conf.DDLPolicy <- DDLPolicy.AlwaysAllow
        conf.QueryExecutionTimeout <- TimeSpan.FromSeconds(10)
        conf.IdleTransationTimeout <- TimeSpan.FromSeconds(10)
    )

See :ref:`edgedb-dotnet-config` for state-configuration details.

For more examples using EdgeDB.Net, check out our
`Github examples repository <https://github.com/edgedb/edgedb-net/tree/dev/examples>`_.

The future of EdgeDB.Net
------------------------

Whats next for EdgeDB.Net? We're currently working on a query builder
to provide an EFCore-like feel without the drawbacks of an ORM. You can preview
the beta query builder by installing it via ``myget``:

.. code-block:: bash

  $ dotnet add package EdgeDB.Net.QueryBuilder \
    --source https://www.myget.org/F/edgedb-net/api/v3/index.json

.. code-block:: cs

  var person = new Person
  {
      Email = "example@example.com",
      Name = "example"
  };

  // A complex insert with links & dealing with conflicts
  var result = await QueryBuilder
      .Insert(new Person
      {
          BestFriend = person,
          Name = "example2",
          Email = "example2@example.com"
      })
      .UnlessConflictOn(x => x.Email)
      .ElseReturn()
      .ExecuteAsync(client);

More examples using the query builder can be found `on our Github`_.

.. note::

  The query builder is in the very early stage of development.
  Be advised: bugs are part of the experience and no API is final! 🤓

We're also working on a `codegen </blog/typesafe-database-querying-via-code-generation>`_
tool to generate .NET code from ``.edgeql`` files. You can read the proposed spec
`on github <https://github.com/edgedb/edgedb-net/pull/3>`_.

Wrapping up
-----------

We can't wait to see what you will build with EdgeDB.Net! ❤️

File feature requests on `Github <https://github.com/edgedb/edgedb-net>`_ and
join the `#edgedb-dotnet <https://discord.com/channels/841451783728529451/950503041889628200>`_
channel on our `Discord`_ to discuss!

.. _Custom Type Builder: https://github.com/edgedb/edgedb-net/blob/dev/src/EdgeDB.Net.Driver/Binary/Builders/TypeBuilder.cs
.. _TypeBuilder.cs#429-445: https://github.com/edgedb/edgedb-net/blob/dev/src/EdgeDB.Net.Driver/Binary/Builders/TypeBuilder.cs#L429-L445
.. _Discord: https://discord.gg/edgedb
.. _EdgeDBClient: https://edgedb.com/docs/clients/dotnet/api#EdgeDB.EdgeDBClient
.. _Span<T>: https://learn.microsoft.com/en-us/dotnet/api/system.span-1?view=net-6.0
.. _on our Github: https://github.com/edgedb/edgedb-net/blob/feat/querybuilder-v2/examples/EdgeDB.Examples.CSharp/Examples/QueryBuilder.cs
