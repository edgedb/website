.. blog:authors:: colin
.. blog:published-on:: 2022-03-02 07:00 AM PT
.. blog:lead-image:: images/graphrelational.jpg
.. blog:guid:: 0a1b726f-0c69-49a9-a013-aca41b18bc93
.. blog:description::
    A conclusive answer to EdgeDB's most frequently asked question: "What is a graph-relational database anyway?"


======================================
The graph-relational database, defined
======================================

On the heels of EdgeDB's recent 1.0 launch, we (rather predictably) received
one question more than any other: what is a graph-relational database? This
post is intended to be the internet's canonical answer to that question.

The graph-relational model is a new conceptual model for representing data.
Under this model, **data is represented as strongly typed objects that contain
set-valued scalar properties and links to other objects.**

.. code-block:: sdl

  type Person {
    required property name -> str;
  }

  type Movie {
    required property title -> str;
    multi link actors -> Person;
  }

Keep in mind that "graph-relational database" is not synonymous with "EdgeDB".
EdgeDB is just the *first* production-ready database that implements the
graph-relational model. Similarly, EdgeQL is not a definitional part of the
paradigm; it's simply our proposal for an open, implementation-independent,
graph-relational query language.

.. code-block:: edgeql

  select Movie {
    title,
    actors: { id, name }
  } filter .title = "The Avengers"

In the future, though, other graph-relational databases may exist with
different type systems, schema syntax, and query languages.

Evolving the relational model
-----------------------------

Graph-relational is best understood as a descendant of the relational paradigm.
The table below provides a terminology map between the shared concepts.

.. list-table::

  * - **Relational**
    - **Graph-relational**
  * - Table ("relation")
    - Object type
  * - Column ("attribute")
    - Property or link
  * - Row ("tuple")
    - Object

However the graph-relational model extends the relational paradigm in three
major ways: *object identity*, *links*, and *cardinality*. We'll discuss each
in detail below.

#1 Objects have a unique identity
---------------------------------

All objects have a globally unique, immutable identifier. There's no need to
explicitly declare this identifier in your schema; it is assumed. In EdgeDB
it's represented as an required, readonly property called ``id`` that has an
exclusive constraint, is auto-assigned a UUID upon insertion, and will never
be reused. In SDL, this would be represented as follows:

.. code-block:: sdl

  required property id -> uuid {
    constraint exclusive;
    readonly := true;
    default := uuid_generate_v1mc();
  }

In the future, other graph-relational databases can represent identity
differently; all that matters is that there is *some concept* of identity.

Relational databases don't do this; tracking object identity requires adding an
appropriately typed column, marking it as a primary key, and specifying a
uniqueness contraint. This column can then be used as a target of foreign key
constraints in other tables.

It's common for graph databases (e.g. Neo4j) to internally assign identifers to
nodes, since a first-class concept identity is a pre-requisite for a non-leaky
concept of links/edges. Speaking of which:

#2 Objects can be connected with links
--------------------------------------

Under the relational model, attribute (column) types are restricted to some set
of primitive datatypes. Inter-table relationships are represented as "just
another column" with a foreign key constraint.

Graph-relational object types, on the other hand, can contain attributes that
store primitive data or *direct references to other objects*. Colloquially,
scalar attributes are known as *properties* and object-typed attributes are
known as *links*. Links are why there's a "graph" in graph-relational.


.. code-block:: sdl

  type Person {
    required property name -> str;
  }

  type Movie {
    required property title -> str;
    multi link actors -> Person;
  }

Note that there's no need to futz with primary keys, foreign key constraints,
or join tables; since each object has a unique identifier, EdgeDB knows how to
represent links without additional configuration. This is what it means for
links to be a "first-class citizen".

As in graph databases, these links can themselves contain properties.

.. code-block:: sdl-diff

    type Person {
      required property name -> str;
    }

    type Movie {
      required property title -> str;
      multi link actors -> Person {
  +     property character_name -> str;
      }
    }


#3 Attributes have a cardinality
--------------------------------

In the relational model, attribute values consist of a name (``"email"``) and a
type (``"text"``). Under the graph-relational model, there is a third
component: the *cardinality*.

The cardinality specifies the *number of values* that can be assigned to the
attribute. In EdgeDB, cardinality is represented internally as a five-valued
enum consisting of ``Empty``, ``One``, ``AtMostOne``, ``AtLeastOne``, and
``Many``. In SDL, these cardinalities are represented with combinations of more
familiar terms: ``required`` vs ``optional`` and ``single`` vs ``multi``.
Consider the following object type.

.. code-block:: sdl

  type Movie {
    property description -> str;
    required property title -> str;
    multi property alt_titles -> str;
    required multi link actors -> Person;
  }

This movie type demonstrates all possible attribute cardinalities expressible
in EdgeDB. The ``title`` property is ``required`` (cannot be empty), the
``alt_titles`` property is ``multi`` (can contain several ``str`` values), and
``actors`` is both (points to one or more ``Person`` objects). Here are the types and cardinalities of each attribute as EdgeDB sees them.

.. list-table::

  * - **Key**
    - **Type**
    - **Cardinality**
  * - ``description``
    - ``str``
    - ``AtMostOne``
  * - ``title``
    - ``str``
    - ``One``
  * - ``alt_titles``
    - ``str``
    - ``Many``
  * - ``actors``
    - ``Person``
    - ``AtLeastOne``

Multi links are necessary to represent many-to-many relationships between
object types. Multi properties are less common, but occasionally useful when
storing an unordered set of values, such as ``alt_titles`` in the sample schema.

.. note::

  Technically the relational model provides one mechanism for constraining
  cardinality: the ``not null`` constraint. Using EdgeDB terminology, this
  changes the cardinality from ``AtMostOne`` to ``One``. There is no affordance
  for cardinalities greater than one.

Everything is a set
^^^^^^^^^^^^^^^^^^^

When we use the word "set", we mean it in the mathematical sense. This
principle :ref:`permeates everything <docs:ref_eql_everything_is_a_set>` in
EdgeDB. There is no distinction between scalar-valued and table-valued
expressions, as in SQL. Everything is a set with a known type and cardinality
(even plain literal values) and can be manipulated with set-theoretic operators
like ``union``.

.. code-block:: edgeql

  edgedb> select "hi";
  {'hi'}
  edgedb> select {"hi"};
  {'hi'}
  edgedb> select {"hi", "there"};
  {'hi', 'there'}
  edgedb> select "hi" union "there";
  {'hi', 'there'}

Nothing is also a set. Like, literally *nothing*. As a happy consequence of the
graph-relational model's set-theoretic core, ``NULL`` is no more. Instead, the
absence of data is simply an empty set.

.. note::

  When executing EdgeQL queries with one of our client libraries, empty sets
  are decoded into idiomatic values. If the set in question has no upper bound
  (cardinality of ``Many`` or ``AtLeastOne``), it would be represented as an
  empty array. Other cardinalities result in ``null/nil/None`` (per the client
  library language).


The future is graph-relational
------------------------------

We think this set of principles, taken together, defines a new kind of database
abstraction that deserves its own term and represents a spiritual successor to
the relational paradigm. Moreover, we think EdgeDB, which recently had its
`first stable release </blog/edgedb-1-0>`_, is extremely awesome and you should
try it.

Head to `our GitHub repo <https://github.com/edgedb/edgedb>`_ for a collection
of useful links, or jump into the :ref:`Quickstart <docs:ref_quickstart>`.
