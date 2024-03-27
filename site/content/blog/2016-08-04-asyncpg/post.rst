.. blog:authors:: elvis yury
.. blog:published-on:: 2016-08-04 12:01 PM EST
.. blog:lead-image:: images/asyncpg.jpg
.. blog:guid:: 24928E01-C34B-49FC-AD25-E579CBE974B0
.. blog:description::
    asyncpg is a new fully-featured open-source Python client
    library for PostgreSQL.


=================================
1M rows/s from Postgres to Python
=================================


`asyncpg`_ is a new fully-featured open-source Python client
library for PostgreSQL. It is built specifically for asyncio
and Python 3.5+ ``async`` / ``await``.  asyncpg is the fastest
driver among common Python, NodeJS and Go implementations.


Why asyncpg?
============

We are building `EdgeDB`_—the next generation object database
with PostgreSQL as a backing store. We need high-performance,
low-latency access to the advanced features of PostgreSQL.

The most obvious option was psycopg2—the most popular Python
driver for PostgreSQL.  It is well-supported, stable, proven
technology.  There is also aiopg, which provides async
interface on top of psycopg2.  With that there is an obvious
question: why reinvent the wheel?  Short answer is twofold:
**features** and **performance**. We will cover each item in
detail below.


Features
========

Data Type Support
-----------------

Our biggest gripe with psycopg2 is its mediocre support for
handling PostgreSQL data types, especially arrays and composite
types.  Rich data type system is one of the hallmarks of
PostgreSQL.  And yet, out of the box psycopg2 only supports
simple builtin types like integers, strings, and timestamps,
forcing the users to write custom "typecasters" for everything
else.  This is cumbersome and inefficient.

.. note::
    :class: aside

    "python-aiopg" benchmark uses the ``psycopg2.extras.DictCursor``
    for fairness, as other driver implementations return
    name-addressable result records. However, the performance
    penalty compared to the default tuple-returning psycopg2
    cursor is so large that we also included the default
    cursor mode.

The reason is fundamental: psycopg2 exchanges data with the
database server in text format. This necessitates a non-trivial
amount of parsing, especially so for complex types.

Unlike psycopg2, asyncpg implements PostgreSQL **binary I/O
protocol**, which, aside from performance benefits, allows for
generic support of container types (arrays,
composites and ranges).


Prepared Statements
-------------------

asyncpg extensively uses PostgreSQL prepared statements.
This is an important optimization feature, as it allows to avoid
repeated parsing, analysis, and planning of queries.
Additionally, asyncpg caches the data I/O pipeline for each
prepared statement.

Prepared statements in asyncpg can be created and used
explicitly.  They provide an API to fetch and introspect query
results. Most query methods are also exposed on the connection
object directly, and asyncpg will create and cache a prepared
statement implicitly.

Ease of Deployment
------------------

Another important feature of asyncpg is that it has **zero**
dependencies. Direct implementation of PostgreSQL protocol means
that there is no need for libpq to be installed, and you can
just ``pip install asyncpg``. Additionally, we provide binary
wheels for Linux, macOS, and Windows.


Performance
===========

It soon became evident that by implementing PostgreSQL
frontend/backend protocol directly, we can yield significant
speed improvements. Our `earlier experience
<https://magic.io/blog/uvloop-blazing-fast-python-networking/>`_
with uvloop has shown that Cython can be used to build very
efficient libraries. asyncpg is written almost entirely in
Cython with careful buffer management and highly optimized
data decoding pipeline.

The result is that asyncpg is, on average, at least **3x faster**
than psycopg2 (or aiopg). This result is remarkable, as psycopg2,
written in C and optimized, is not slow at all. See the
benchmarks section below for more.


Benchmarks
==========

Similarly to `uvloop`_, we created a standalone `toolbench`_ to
measure and report the performance of asyncpg and other
PostgreSQL driver implementations.  We measured query
throughput (in rows per second) and latency.  The main purpose
of this benchmark is to measure the driver overhead.

For fairness, all tests were run in a single-thread
(``GOMAXPROCS=1`` for Go code) in async mode. Python drivers were
run under uvloop.

The benchmark results featured in this post were obtained
from a bare-metal server with the following setup:

* CPU: Intel Xeon E5-1620 v2 @ 3.70GHz, 64GiB DDR3
* Gentoo Linux, GCC 4.9.3
* Go 1.6.3, Python 3.5.2, NodeJS 6.3.0
* PostgreSQL 9.5.2

Driver Implementations:

* Python: asyncpg-0.5.2, psycopg2-2.6.2, aiopg-0.10.0,
  uvloop-0.5.0. aiopg is a tiny low-overhead wrapper of psycopg2
  that adds async capabilities to it.
* NodeJS: pg-6.0.0, pg-native-1.10.0
* Golang: github.com/lib/pg\@4dd446efc1,
  github.com/jackc/pgx\@b3eed3cce0


.. blog:chart:: BarBoxLatencyChart

    {
        "options": {
            "titleField": "name",
            "stacked": false,
            "dataField": "data",
            "keyMetricField": "rps",
            "barYTitle": "Rows / sec",
            "boxYTitle": "Latency (msec)"
        },
        "data": [
            {
                "name": "python-aiopg",
                "data": {
                    "rps": 57041.22,
                    "latency_std": 1.18,
                    "qps": 234.19,
                    "latency_cv": 3.46,
                    "latency_min": 6.915,
                    "latency_percentiles": [
                        [25, 33.954],
                        [50, 34.039],
                        [75, 34.15],
                        [90, 34.268],
                        [99, 35.864],
                        [99.99, 39.477]
                    ],
                    "queries": 2351.88,
                    "latency_mean": 34.076,
                    "latency_max": 39.476,
                    "duration": 10.04
                }
            }, {
                "name": "nodejs-pg",
                "data": {
                    "rps": 94887.84,
                    "latency_std": 6.471,
                    "qps": 389.56,
                    "latency_cv": 31.61,
                    "latency_min": 5.814,
                    "latency_percentiles": [
                        [25, 17.215],
                        [50, 18.554],
                        [75, 20.548],
                        [90, 31.087],
                        [99, 42.694],
                        [99.99, 53.122]
                    ],
                    "queries": 3916.05,
                    "latency_mean": 20.469,
                    "latency_max": 56.154,
                    "duration": 10.05
                }
            }, {
                "name": "nodejs-pg-native",
                "data": {
                    "rps": 120253.86,
                    "latency_std": 2.917,
                    "qps": 493.69,
                    "latency_cv": 18.05,
                    "latency_min": 4.895,
                    "latency_percentiles": [
                        [25, 14.357],
                        [50, 14.608],
                        [75, 16.597],
                        [90, 22.308],
                        [99, 24.37],
                        [99.99, 32.212]
                    ],
                    "queries": 4960.45,
                    "latency_mean": 16.153,
                    "latency_max": 32.616,
                    "duration": 10.05
                }
            }, {
                "name": "python-aiopg-tuples",
                "data": {
                    "rps": 285527.42,
                    "latency_std": 0.228,
                    "qps": 1172.23,
                    "latency_cv": 3.35,
                    "latency_min": 3.32,
                    "latency_percentiles": [
                        [25, 6.663],
                        [50, 6.698],
                        [75, 6.922],
                        [90, 7.061],
                        [99, 7.512],
                        [99.99, 9.082]
                    ],
                    "queries": 11729.03,
                    "latency_mean": 6.813,
                    "latency_max": 9.187,
                    "duration": 10
                }
            }, {
                "name": "golang-libpq",
                "data": {
                    "rps": 473519.93,
                    "latency_std": 1.542,
                    "qps": 1944.03,
                    "latency_cv": 37.54,
                    "latency_min": 1.132,
                    "latency_percentiles": [
                        [25, 3.131],
                        [50, 3.86],
                        [75, 4.712],
                        [90, 6.3],
                        [99, 8.426],
                        [99.99, 16.397]
                    ],
                    "queries": 19453.79,
                    "latency_mean": 4.107,
                    "latency_max": 16.876,
                    "duration": 10.01
                }
            }, {
                "name": "golang-pgx",
                "data": {
                    "rps": 635105.68,
                    "latency_std": 1.46,
                    "qps": 2607.42,
                    "latency_cv": 47.78,
                    "latency_min": 0.598,
                    "latency_percentiles": [
                        [25, 1.988],
                        [50, 3.052],
                        [75, 4.124],
                        [90, 4.718],
                        [99, 6.95],
                        [99.99, 10.14]
                    ],
                    "queries": 26092.66,
                    "latency_mean": 3.056,
                    "latency_max": 11.246,
                    "duration": 10.01
                }
            }, {
                "name": "python-asyncpg",
                "data": {
                    "rps": 911049.59,
                    "latency_std": 0.517,
                    "qps": 3740.3,
                    "latency_cv": 24.29,
                    "latency_min": 1.025,
                    "latency_percentiles": [
                        [25, 1.879],
                        [50, 2.018],
                        [75, 2.237],
                        [90, 2.442],
                        [99, 4.275],
                        [99.99, 7.879]
                    ],
                    "queries": 37413.6,
                    "latency_mean": 2.129,
                    "latency_max": 10.24,
                    "duration": 10
                }
            }
        ]
    }


The charts show the geometric average of results obtained
by running four types of queries:

* A relatively wide row query selecting all rows from the
  ``pg_type`` table (~350 rows).  This is relatively close to
  an average application query.  The purpose is to test general
  data decoding performance. This is the titular benchmark, on
  which asyncpg achieves 1M rows/s.
  See :blog:local-file:`details <res/report.html>`.

* A query that generates 1000 rows containing a single integer.
  This benchmark is designed to test the overhead of creating
  and returning result records.
  See :blog:local-file:`details <res/report.html>`.

* A query returning 100 rows, each containing a 1KB binary blob.
  This benchmark is designed to stress the I/O and read buffers
  in particular.
  See :blog:local-file:`details <res/report.html>`.

* A query returning 100 rows, each containing an array of 100
  integers. This benchmark is designed to test the performance
  of array decoding. Here, asyncpg is slower than the fastest
  implementation (go lib/pq) due to the overhead of creating
  and freeing Python tuple objects.
  See :blog:local-file:`details <res/report.html>`.


Conclusion
==========

We firmly believe that high-performance and scalable systems
in Python are possible.  For that we need to put maximum effort
into making fast, high-quality drivers, event loops, and frameworks.

`asyncpg`_ is another step in that direction. It is the result of
careful design fuelled by our experience creating uvloop and
using Cython and asyncio efficiently.


.. _asyncpg: https://github.com/magicstack/asyncpg/
.. _uvloop: https://github.com/magicstack/uvloop/
.. _toolbench: https://github.com/magicstack/pgbench
.. _EdgeDB: https://www.edgedb.com
