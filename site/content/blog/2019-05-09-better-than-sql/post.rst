.. blog:authors:: elvis
.. blog:lead-image:: images/sequel.jpg
.. blog:published-on:: 2019-05-09 02:00 PM EST
.. blog:guid:: 993d4a67-da05-484e-858b-6f50c9e7ca31
.. blog:description::
    The questions we often hear are "Why create a new query language?" and
    "What's wrong with SQL?".  This blog post contains answers to both.





=========================
We Can Do Better Than SQL
=========================

.. _ref_better_than_sql:

The questions we often hear are "Why create a new query language?" and
"What's wrong with SQL?".  This post contains answers to both.

Before we begin, let's overview some of the history of how the relational
model came to be, and how SQL was created.


A Brief History of the Relational Model and SQL
===============================================

The relational model was introduced by Edgar F. Codd in a seminal 1970 paper
"A Relational Model of Data for Large Shared Data Banks" [#fcodd-1970]_.
There, Codd postulated that all data in a database can be represented in
terms of sets of tuples, called *relations*. Codd also invented a form of
first-order predicate logic to describe the database queries: *tuple
relational calculus*.

Codd's ideas were revolutionary.  For the first time, a database,
and a universal way to query it, was described in a succinct, consistent
mathematical model.  This, naturally, created lots of interest in further
research and, importantly, into practical implementation of the relational
model.

In 1974 Donald Chamberlin and Raymond Boyce published a paper
[#fchamberlin-1974]_, which introduced "a set of simple operations on tabular
structures, [...] of equivalent power to the first order predicate calculus".
Chamberlin and Boyce felt that the formal relational query languages proposed
at the time were too hard to understand for "users without formal training in
mathematics or computer programming" and thought that the "predominant use of
the language would be for ad-hoc queries" [#fchamberlin-2012]_.  Initially,
the authors did not consider SQL to be a "serious" language.  Nonetheless,
the great interest in the commercial application of the relational model had
pushed IBM to quickly adopt and productize SQL, which was also picked up by
their quickly-rising competitor--Oracle.

IBM had an overwhelmingly large influence over the tech market at the time,
so SQL became a de facto standard for relational databases, and then a proper
standard with the publication of the first ANSI standard in 1989 that
essentially circumscribed the most prominent existing implementations
of SQL.  Subsequent versions of the standard continued to be primarily
influenced by the commercial vendors.

Today, SQL is by far the most widely used database language.  But that does
not necessarily mean that it represents the best of what we can do.
In fact, SQL's beginnings as a "simple, ad-hoc" language coupled with
"design by implementation" from competing vendors had left the language with
a baggage of severe issues.


Critique of SQL
===============

SQL, especially its earlier versions, was heavily criticized by the experts,
including Codd himself [#fcodd-1990]_, as well as C. J. Date, who published a
multitude of papers and books on the subject ([#fdate-1985]_, [#fdate-1987]_,
[#fdate-2009]_).  While many of the early shortcomings were fixed in the later
versions of the standard, some of the serious issues had been only further
ingrained.

Some of the complaints here apply to SQL as a whole, while others are specific
to a certain implementation.  We are primarily using PostgreSQL for the
examples.

SQL's shortcomings can be grouped into these categories:

* lack of proper orthogonality --- SQL is hard to compose;
* lack of compactness --- SQL is a large language;
* lack of consistency --- SQL is inconsistent in syntax and semantics;
* poor system cohesion --- SQL does not integrate well enough with
  application languages and protocols.


.. _ref_better_than_sql_orthogonality:

Lack of Orthogonality
---------------------

Orthogonality in a programming language means that a relatively small set
of primitive constructs can be combined in a relatively small number of ways.
A language with good orthogonality is smaller, more consistent, and is
easier to learn due to there being few exceptions from the overall set of
rules.  Conversely, bad orthogonality leads to a large language with many
exceptions and caveats.

A good indicator of orthogonality is the ability to substitute an arbitrary
part of an expression with a variable or a function call, without any effect
on the final result.

In SQL, such generic substitution is not possible, since there are *two*
mutually incompatible kinds of expressions:

* A *table expression* is a SQL expression that yields a table:
  ``SELECT * FROM table``.

* A *scalar expression* is a SQL expression that yields a single scalar value:
  ``SELECT count(*) FROM table``.

Table expressions can only be used in a ``FROM`` clause, in a function, or with
an operator that specifically expects a table expression as input.
What's worse the scalar and table expressions may have exactly the same syntax,
which can be a source of further confusion.

For example, let's imagine we needed to list the names of all department
heads in a company.  This query would do the job:

.. code-block:: sql

    SELECT name
    FROM emp
    WHERE role = 'dept head'

Now let's say we needed to add this bit to a larger query that extracts
information about a department.  An intuitive way is to simply add the
above as a subquery to the target list of our larger query:

.. code-block:: sql

    SELECT
        dept.name,
        ...
        (SELECT name FROM emp
         WHERE role = 'dept head' AND deptno = dept.no)
    FROM
        dept
        ...

This is legal, but *only* if the subquery returns not more than one row.
Otherwise, an error would be raised at run time.  To account for multiple
department heads, we would need to rewrite the query using a join:

.. code-block:: sql

    SELECT
        dept.name,
        ...
        head.name
    FROM
        dept
        INNER JOIN emp AS head
            ON (head.deptno = dept.no
                AND head.role = 'dept head')
        ...

The difference in structure is large enough to make any sort of source-level
query reuse impractical.


Lack of Compactness
-------------------

.. blog:quote:: Paolo Atzeni et al.

    Few claim that SQL is an elegant language characterized by orthogonality.
    Some call it an elephant on clay feet.  With each addition, its body grows,
    and it becomes less stable.  SQL standardization is largely the domain of
    database vendors, not academic researchers without commercial interests
    or users with user interests. [#fatzeni-2013]_

SQL is not a small language. At the time of writing the PostgreSQL
implementation contains **469 keywords**. Just part 2 (out of 14) of the
SQL:2016 standard has **1732 pages**.

The main reason is that SQL, in line with its original goals, strives to be
an English-like language, catered to "non-professionals".  However, with the
growth of the language, this verbosity has contributed *negatively* to the
ability to write and comprehend SQL queries.  We learnt this lesson with
COBOL, and the world has long since moved on to newer, more succinct
programming languages.

In addition to keyword proliferation, the orthogonality issues discussed
above make queries more verbose and harder to read.


Lack of Consistency
-------------------

SQL is arbitrarily inconsistent both in its syntax and semantics. What
makes things even worse is that different databases have their own version
of SQL, often incompatible with other SQL variants.

Here are a few examples of entirely different calling conventions in SQL:

.. code-block:: sql

    SELECT substring('PostgreSQL' from 8 for 3);
    SELECT substring('PostgreSQL', 8, 3); -- PostgreSQL-only syntax

    SELECT trim(both from 'yxSQLxx', 'xyz');
    SELECT extract(day from timestamp '2001-02-16 20:38:40');

There are two syntaxes that specify the ordering of the input set in an
aggregate function:

.. code-block:: sql

    SELECT array_agg(foo ORDER BY bar)

and

.. code-block:: sql

    SELECT rank(foo) WITHIN GROUP (ORDER BY bar)

The list of inconsistencies like this does not end here and can be continued,
but that's beyond the scope of this blog post.


.. _ref_null_bag_of_surprises:

NULL --- a bag of surprises
---------------------------

.. blog:quote:: Edgar F. Codd

   In some cases of inadequate handling of missing information,
   the problem is incorrectly perceived to be a problem of the
   relational model. In fact, the problem stems from the inadequacies
   of SQL and its non-conformance to the relational model. [#fcodd-1990]_

It has been extensively argued that ``NULL`` is the biggest misfeature of SQL
([#fcodd-1987]_, [#fdate-1986]_, [#fdate-1987]_).
In fact, the handling of ``NULL`` in contemporary SQL implementations is so
surprising, inconsistent, and dangerous that this topic deserves a separate
section.

``NULL`` is so special that it's not equal to anything, including itself::

    postgres=# select NULL = NULL;
     ?column?
    ----------

    (1 row)


In fact, almost any operation on ``NULL`` will return ``NULL`` and the
effect may be very subtle::

    postgres=# CREATE TABLE x (a int, b text);
    CREATE TABLE
    postgres=# INSERT INTO x(a, b)
               VALUES (1, 'one'), (2, 'two'), (NULL, 'three')
               RETURNING a, b;
     a |   b
    ---+-------
     1 | one
     2 | two
       | three
    (3 rows)

    postgres=# SELECT * FROM x WHERE a NOT IN (1, null);
     a | b
    ---+---
    (0 rows)

But, in some cases ``NULL`` *is* equal to itself, such as in ``DISTINCT``::

    elvis=# SELECT DISTINCT *
            FROM (VALUES (1), (NULL), (NULL)) AS q;
     column1
    ---------

           1
    (2 rows)

or ``UNION``::

    elvis=# VALUES (1), (NULL) UNION VALUES (2), (NULL);
     column1
    ---------

           1
           2
    (3 rows)


Much of the traditional logic and boolean algebra rules cannot be safely
applied to SQL boolean expressions in the presence of ``NULL``.  For example,
the law of excluded middle, *p* OR NOT *p*, does not evaluate to true if *p*
is ``NULL``::

    postgres=# SELECT count(*) FROM x WHERE a = 1 OR a != 1;
     count
    -------
         2
    (1 row)

Worse yet::

    postgres=# SELECT
                   b,
                   CASE WHEN a = 1
                   THEN 'one'
                   ELSE 'not one'
                   END
               FROM x;
       b   |  case
    -------+---------
     one   | one
     two   | not one
     three | not one
    (3 rows)

    postgres=# SELECT
                   b,
                   CASE WHEN a != 1
                   THEN 'not one'
                   ELSE 'one'
                   END
               FROM x;
       b   |  case
    -------+---------
     one   | one
     two   | not one
     three | one
    (3 rows)

The the row containing ``b=3`` is classified either as ``'one'`` or
``'not one'`` even though the construction of the ``CASE`` expression
appears equivalent in both cases.

Rows containing ``NULL`` sometimes get counted, and sometimes not::

    postgres=# SELECT count(a) FROM x;
     count
    -------
         2
    (1 row)

    postgres=# SELECT cardinality(array_agg(a)) FROM x;
     cardinality
    -------------
               3
    (1 row)

    postgres=# SELECT count(*) FROM x;
     count
    -------
         3
    (1 row)

Rows containing ``NULL`` cannot be compared::

    postgres=# SELECT (NULL, 1) = (NULL, 1);
     ?column?
    ----------

    (1 row)

And even ``IS NULL`` doesn't work::

    postgres=# SELECT (NULL, 1) IS NULL;
     ?column?
    ----------
     f
    (1 row)

    postgres=# SELECT (NULL, 1) IS NOT NULL;
     ?column?
    ----------
     f
    (1 row)

What's worse, the databases often uses ``NULL`` to indicate an error condition,
so your query might contain ``NULLs`` even if you don't expect them::

    postgres=# SELECT (ARRAY[1, 2])[3];
     array
    -------

    (1 row)

    postgres=# SELECT to_char(timestamp '2001-02-16 20:38:40', '');
     to_char
    ---------

    (1 row)

In PostgreSQL division by zero is an exception, whereas MySQL
simply returns ``NULL``::

    mysql> SELECT 1 / 0;
    +-------+
    | 1 / 0 |
    +-------+
    |  NULL |
    +-------+
    1 row in set, 1 warning (0.00 sec)

There are many more cases like these, and there is no consistency in a single
SQL implementation, let alone across all implementations.


Why Does All This Matter?
=========================

OK, so we have highlighted the shortcomings of SQL.  Why do they matter?
It's all about *ergonomics*.  Orthogonality, compactness, and consistency
are all *essential* traits of a programming language that is easy to learn
and use effectively on every level of expertise, team size, and project
complexity.

We have become accustomed to a constant improvement and reimagination of
programming languages.  Swift, Rust, Kotlin, Go, just to name a few, are
great examples in the advancement of engineer ergonomics and productivity.
But SQL, often hidden behind layers of ORMs and frameworks, is still very
much the dominant data language.

The NoSQL movement was born, in part, out of the frustration with the
perceived stagnation and inadequacy of SQL databases.  Unfortunately, in
the pursuit of ditching SQL, the NoSQL approaches also abandoned the
relational model and other *good* parts of RDBMSes.


EdgeQL: Query Language Evolution
================================

The relational model is still the most generally applicable and effective
method of representing data.  The concept of SQL as a declarative,
storage-neutral query language is powerful and versatile.  We don't need to
abandon either.  What we *do* need is a "better SQL": a query language that
affords more power to its users, but that is also simpler and more consistent.

This is exactly what we are working hard to achieve with **EdgeQL**.  We spent
years of research and development, focusing on usability and performance
without compromising correctness.  In our `earlier blog post <alpha_post_>`_
we described some of the great features of the language, but it's worth
getting into some detail here to highlight how we are solving the issues
brought up in this post.

Orthogonality, Consistency, and Compactness
-------------------------------------------

In EdgeQL :ref:`every value is a set <docs:ref_eql_everything_is_a_set>` and
every expression is a function over sets, returning a set.  This means that,
syntactically, any part of an EdgeQL expression can be factored out into a
view or a function without changing other parts of the query.

Consider a query returning movies together with the number of reviews for
each one:

.. code-block:: edgeql

    SELECT Movie {
        description,
        number_of_reviews := count(.reviews)
    };

Let's say we need the average number of reviews across all movies:

.. code-block:: edgeql

    SELECT math::mean(
        Movie {
            description,
            number_of_reviews := count(.reviews)
        }.number_of_reviews
    );

Now we *also* need the maximum number of reviews per movie:

.. code-block:: edgeql

    SELECT (
        avg := math::mean(
            Movie {
                number_of_reviews := count(.reviews)
            }.number_of_reviews
        ),
        max := max(
            Movie {
                number_of_reviews := count(.reviews)
            }.number_of_reviews
        )
    );

This is a tad unwieldy, let's make the query cleaner by factoring out the
``Movie`` expression into a view:

.. code-block:: edgeql

    WITH
        MovieReviewCount := Movie {
            number_of_reviews := count(.reviews)
        }
    SELECT (
        avg := math::mean(MovieReviewCount.number_of_reviews),
        max := max(MovieReviewCount.number_of_reviews),
    );

Since everything is a function over sets, there are only a handful of keywords
in EdgeQL queries, and they are used mostly to delineate the major parts of a
query.


Missing Data
------------

In EdgeQL, the notion of missing data is simple: it is always an empty set,
and any element-wise operation on an empty set is, likewise, an empty set:

.. code-block:: edgeql-repl

    edgedb> SELECT True OR <bool>{};
    {}
    edgedb> SELECT True AND <bool>{};
    {}

Aggregation is consistent:

.. code-block:: edgeql-repl

    edgedb> SELECT count({});
    {0}
    edgedb> SELECT array_agg(<str>{});
    {[]}

In EdgeQL, sets are flat, i.e. a set (including an empty one) cannot be an
element of another set:

.. code-block:: edgeql-repl

    edgedb> SELECT {1, {2, 3}, {}, {}};
    {1, 2, 3}

The set constructor notation above is actually equivalent to a ``UNION``
operation, which better highlights its set nature:

.. code-block:: edgeql-repl

    edgedb> SELECT {1} UNION {2, 3} UNION {} UNION {};
    {1, 2, 3}

An empty set can be coalesced into a non-empty set:

.. code-block:: edgeql-repl

    edgedb> WITH empty_set_expr := <int64>{}
    ....... SELECT empty_set_expr ?? {1, 2};
    {1, 2}
    edgedb> WITH empty_set_expr := <int64>{}
    ....... SELECT {1, 2, 3} IF EXISTS empty_set_expr ELSE 42;
    {42}


System Integration
------------------

In EdgeDB, the data schema is formulated in a way that is
:ref:`much closer <docs:ref_quickstart_createdb_sdl>` to the contemporary
application data model. This makes the database-application schema reflection
straightforward and efficient.

Unlike SQL, EdgeQL can easily extract arbitrary data trees:

.. code-block:: edgeql

    SELECT Movie {
        description,

        directors: {
            full_name,
            image,
        }
        ORDER BY .last_name,

        cast: {
            full_name,
            image,
        }
        ORDER BY .last_name,

        reviews := (
            SELECT Movie.<movie[IS Review] {
                body,
                rating,
                author: {
                    name,
                    image,
                }
            }
            ORDER BY .creation_time DESC
        ),
    };

Coupled with extensive :ref:`JSON support <docs:ref_std_json_construction>`,
this makes writing REST and :ref:`GraphQL <docs:ref_graphql_index>` backends
an order of magnitude easier.


Final Words
===========

SQL started with a goal to empower non-programmers to work with the relational
data effectively.  Despite its shortcomings, it has arguably been wildly
successful, with most databases implementing or emulating it.  However, like
any solution, SQL is facing increasing inadequacy in the support of the new
requirements, modes of use and user productivity.  It is time we do
something about it.

`Drop us a line <mailto:hello@edgedb.com>`_ if you have any
inquiries or feedback.

`Follow EdgeDB <twitter_>`_ on Twitter, and stay tuned for updates!

.. _alpha_post: https://www.edgedb.com/blog/edgedb-1-0-alpha-1/

.. _twitter: https://twitter.com/edgedatabase
.. _github: https://github.com/edgedb/edgedb
.. _orm_vietnam: http://blogs.tedneward.com/post/the-vietnam-of-computer-science/


.. [#fatzeni-2013]
   Atzeni P. et al.,
   The relational model is dead, SQL is dead, and I don’t feel so good myself.
   ACM SIGMOD Record, 42(2):64-68, 2013.

.. [#fchamberlin-1974]
   Chamberlin D. D, Boyce R. F.,
   "SEQUEL: A Structured English Query Language",
   ACM SIGFIDET 1974, pp 249-264.

.. [#fchamberlin-2012]
   Chamberlin D. D,
   "Early History of SQL",
   IEEE Annals of the History of Computing, 34(4):78-82, 2012

.. [#fcodd-1970]
   Codd E. F.,
   "A relational model of data for large shared data banks",
   Communications of the ACM CACM, 13(6):377-387, 1970

.. [#fcodd-1987]
   Codd E. F.,
   "More commentary on missing information
   (applicable and inapplicable information)",
   ACM SIGMOD Record 16(1):42-47, 1987.

.. [#fcodd-1990]
   Codd E. F.,
   "The relational model for database management: version 2"
   Addison-Wesley, Mass. 1990.

.. [#fdate-1985]
   Date C. J.,
   "A critique of the SQL database language",
   ACM SIGMOD Record 14(3):8-54, 1984.

.. [#fdate-1986]
   Date C. J.,
   "Null Values in Database Management.
   In Relational Databases: Selected Writings",
   Addison-Wesley, Mass. 1986.

.. [#fdate-1987]
   Date C. J.,
   "Where SQL falls short",
   Datamation 33(9):83-86, 1987.

.. [#fdate-2009]
   Date C. J.,
   "SQL and Relational Theory",
   O’Reilly, 2009
