.. blog:authors:: ambv
.. blog:published-on:: 2020-10-08 10:00 AM PT
.. blog:lead-image:: images/alpha6.jpg
.. blog:guid:: a9a9df7a-08e9-11eb-aded-acde48001122
.. blog:description::
    The new EdgeDB 1.0 Alpha 6 "Wolf 359" release brings a slew of EdgeQL
    updates to the table.



=============================
EdgeDB 1.0 Alpha 6 "Wolf 359"
=============================

Looking at another nearby star, Wolf 359, we're pleased to release the
sixth and final alpha release of EdgeDB 1.0.  Yes, we're getting close
to the public beta!

In the meantime, you can `download <download_>`_ 1.0a6 in a number of ways or
try it out in our `interactive tutorial <tutorial_>`_ without the need to
install anything.

This release focuses on polishing EdgeQL, the query language that's
one of the main reasons we believe we're on the
`path to a 10X database <tenex_>`_.

.. note::
    :class: aside-nobg

    :blog:github-button:`href:https://github.com/edgedb/edgedb|size:large|title:EdgeDB`

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


Improved UPDATE
---------------

Coalescing inside ``UPDATE`` queries is now allowed. This is useful for
complex self-referencing sets.  For example, let's imagine a tree node:

.. code-block:: sdl

   type Tree {
     required property val -> str {
       constraint exclusive;
     }

     link parent -> Tree;
     multi link children := .<parent[IS Tree];
   }

We can fill a database with trees now for example with data like:

.. code-block:: edgeql

  # Root node
  INSERT Tree {val := '0'};

  # First-level children
  INSERT Tree {
    val := '00', parent := (SELECT DETACHED Tree FILTER .val = '0')};
  INSERT Tree {
    val := '01', parent := (SELECT DETACHED Tree FILTER .val = '0')};
  INSERT Tree {
    val := '02', parent := (SELECT DETACHED Tree FILTER .val = '0')};

  # Second-level children
  INSERT Tree {
    val := '000', parent := (SELECT DETACHED Tree FILTER .val = '00')};
  INSERT Tree {
    val := '010', parent := (SELECT DETACHED Tree FILTER .val = '01')};

  # Another tree's root node
  INSERT Tree {val := '1'};

  # First-level children of the other tree
  INSERT Tree {
    val := '10', parent := (SELECT DETACHED Tree FILTER .val = '1')};
  INSERT Tree {
    val := '11', parent := (SELECT DETACHED Tree FILTER .val = '1')};

Now, with the new ``UPDATE`` statement we can transform values of all
nodes, including the root node, with a single query like:

.. code-block:: edgeql

   UPDATE Tree
   SET {
     val := .val ++ '_p' ++ (('_' ++ .parent.val) ?? '')
   };

This query adds the parent's value to the child, resulting in our data
transformed to:

.. code-block:: json

  [
    {
      'val': '0_p',
      'children': [
        {
          'val': '00_p_0',
          'children': [{'val': '000_p_00', 'children': []}]
        },
        {
          'val': '01_p_0',
          'children': [{'val': '010_p_00', 'children': []}]
        },
        {
          'val': '02_p_0',
          'children': []
        }
      ]
    },
    {
      'val': '1_p',
      'children': [
        {
          'val': '10_p_1',
          'children': []
        },
        {
          'val': '11_p_1',
          'children': []
        }
      ]
    }
  ]

If you're wondering how we got from EdgeDB objects to JSON, it's because
our clients natively support :js:meth:`returning JSON from a query
<docs:Client.queryJSON>`.


Better constraints
------------------

The expression transformer became more powerful, allowing usage of
the ``EXISTS`` operator inside constraint expressions. For example:

.. code-block:: edgeql

  CREATE TYPE Node {
    CREATE LINK child -> Child {
      # emulating "required"
      CREATE CONSTRAINT expression ON (EXISTS __subject__)
    }
  };

Partial paths are now also allowed in constraint expressions. For
example:

.. code-block:: edgeql

  CREATE TYPE Vector {
    CREATE PROPERTY x -> float64;
    CREATE PROPERTY y -> float64;
    CREATE CONSTRAINT expression ON (
      .x^2 + .y^2 < 25
    );
  };


More powerful functions
-----------------------

EdgeDB now supports a shorthand syntax for EdgeQL functions:

.. code-block:: sdl

  function area(shape: Circle)
    -> float64 using (3.1415 * shape.radius ^ 2);

This could be achieved with an intermediate ``SELECT`` before which was
more verbose:

.. code-block:: sdl

  function area(shape: Circle)
    -> float64
  from edgeql $$
    SELECT 3.1415 * shape.radius ^ 2
  $$;


New enum syntax
---------------

In previous releases you could define enumerations like this:

.. code-block:: sdl

  scalar type Color extending enum<'red', 'green', 'blue'>;

This allowed arbitrary strings as enum values.  We are deprecating this
in favor of a new syntax using regular identifiers like:

.. code-block:: sdl

  scalar type Color extending enum<Red, Green, Blue>;

This will allow us in a future release to adopt a more natural
(and less verbose!) syntax for referring to an enum value like:

.. code-block:: edgeql

  SELECT schema::Cardinality.ONE;

instead of the current:

.. code-block:: edgeql

  SELECT <schema::Cardinality>'ONE';


Improve RTL text handling
-------------------------

We noticed that the names of some standard functions was misleading when
used with right-to-left text.  We decided to rename them as follows for
clarity:

==================== =====================================
 Old name             New name
==================== =====================================
 ``std::str_lpad``    :eql:func:`docs:std::str_pad_start`
 ``std::str_rpad``    :eql:func:`docs:std::str_pad_end`
 ``std::str_ltrim``   :eql:func:`docs:std::str_trim_start`
 ``std::str_rtrim``   :eql:func:`docs:std::str_trim_end`
==================== =====================================

Predictable DML
---------------

There are some limitations to using the Data Manipulation Language
(``INSERT``, ``DELETE``, or ``UPDATE``) statements as part of other
expressions.  For example, they cannot appear in conditionals, such as
``??`` and ``IF`` as they would be executed regardless of the conditional
expression's state.

Function calls are another interesting case.  They can be optimized out
by the query planner, leading to undefined behavior if volatile functions
were to contain DML statements.

The safe thing here is to also disallow this behavior and this is the
plan. However, since that would break existing users, we are now working on a
way to selectively enable DML in functions. We laid the mechanisms to enable
prohibition but there's no enforcement yet in this release.

Finally, DML statements cannot be correlated with other query components,
basically they must always be independent of the rest of the query in such a
way that refactoring them into a ``WITH`` block doesn't change the semantics.
We've been disallowing this for a while but this release brings several
improvements to it.


CLI improvements
----------------

EdgeQL changes are not the only area of improvement this time.  The CLI
interface learned a few handy tricks!  First and foremost, you can now
install EdgeDB in a Docker container straight from the CLI with::

  $ edgedb server install --method=docker

The CLI is now also able to upgrade itself.  To allow this, it performs
a :ref:`network check <docs:ref_cli_edgedb_network>` to see if it's the
newest version.

Finally, on the server-side, initializing databases was also improved with
the newly added ``--bootstrap-script`` and ``--bootstrap-command`` arguments
that allow the server to run commands straight after database bootstrap.


Summary
-------

As usual, the :ref:`change log <docs:ref_changelog_alpha6>` provides a detailed
story of the changes in this release.

If you have any questions, feel free to join the conversation `on GitHub
Discussions <discussions_>`_, or ask in form of `a bug report or a feature
request <github_>`_.

For future announcements, you can `find us on Twitter <twitter_>`_.


.. _tenex: /blog/a-path-to-a-10x-database
.. _download: /download
.. _github: https://github.com/edgedb/edgedb
.. _tutorial: https://www.edgedb.com/tutorial
.. _twitter: https://twitter.com/edgedatabase
.. _bettersql: /blog/we-can-do-better-than-sql
.. _edgedbjs: https://github.com/edgedb/edgedb-js/
.. _discussions: https://github.com/orgs/edgedb/discussions
