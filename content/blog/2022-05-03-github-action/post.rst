.. blog:authors:: fantix
.. blog:published-on:: 2022-05-02 10:00 AM PT
.. blog:lead-image:: images/banner.jpg
.. blog:guid:: 047ce10e-b7dc-4dad-8d66-eeb08d88b9e2
.. blog:description::
    We use GitHub Actions for a heavy CI workflow consisting of
    thousands of tests that takes 2+ hours. But with a bit of cleverness, we
    parallelized our workflow and reduce the runtime to just 10 minutes.

===================================================================
How we sharded our test suite for 10x faster runs on GitHub Actions
===================================================================

At EdgeDB, we use GitHub Actions for a heavy CI workflow consisting of
thousands of tests and various build processes that takes 2+ hours to run
under normal conditions. But with a bit of cleverness, we found a way to
parallelize our workflow across several workers and reduce the runtime to just
10 minutes.

When the world was one
----------------------

EdgeDB has a rather sophisticated test suite to cover all the features we've
built and regressions we've discovered over the years. With about 5000 test
cases and 60 different database setups (and still growing!), we're able to
build new features fast with full confidence in the stability of EdgeDB.

However, this gloriously thorough test suite comes with a major caveat: it
takes forever to run. On a typical laptop, the full suite would take around
30-45 minutes. On a beefy PC with a 32-core CPU and 64GB RAM,
``edb test -j32`` runs like crazy and completes within 5 minutes. But on the
built-in GitHub Actions runner with a 2-core CPU and 7GB RAM, it took 2 hours
and 22 minutes.

With a growing team all contributing to the same repo, this quickly started
dragging down our ability to collaborate and iterate quickly. We started
looking into the problem. One early idea was to simply bring in our a beefy
machine and host our own GitHub Actions runner. That would work, but why scale
our runner vertically, when it's possible (and free!) to scale horizontally?

So we had an idea: split our test suite across multiple runners that work in
parallel using GitHub's `build matrix <https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs>`_ feature.

The divide
----------

But first, we needed a way to evenly split up our 5000-ish tests into separate
"shards", such that no single slow-poke would delay the whole run. In EdgeDB
(and most projects), automated tests are relatively consistent in their
running time. So we did a few runs of the entire test suite to compute the
average runtime of each test.

.. code-block:: python

    at, c = stats.get(name, (0, 0))
    stats[name] = (at + (t - at) / (c + 1), c + 1)

Above, ``stats``, a Python ``dict``, ``name`` is just the full name of a a
single test, and ``at`` is the average runtime of this test among ``c`` runs.
At the end of this process, we wrote ``stats`` to disk as a CSV file.

.. note::

  Arguably, this should be replaced by a windowed running average, but that
  would increase the size of the ``stats`` CSV. And we're keeping things
  simple(-ish).

Then comes the hard part. How do we shard our tests into evenly-sized buckets?

The setup conundrum
^^^^^^^^^^^^^^^^^^^

This may seem simple at first, but we quickly encountered a complication. Our
simple statistics don't take *test setup* into consideration.

In the case of EdgeDB, we have about 60 different test setups, each
associated with dozens or hundreds of tests. A "setup" consists of a schema,
some sample data, and other bits of database configuration. Initializing these
setups can be slow, so it's important to avoid initializing setups multiple
times in different shards if possible. Some tests aren't associated with a
particular setup; we call these *standalone tests*. Tests that are associated
with a particular setup are called *setup-linked tests*.

The `actual algorithm <https://github.com/edgedb/edgedb/blob/00083864cc165d69665afe96eb087fa1fed78280/edb/testbase/server.py#L1775>`_ is a
bit too long to include in its entirely (about 100 lines). Instead I'll just
quickly break down how it works.

**#1 Build the queues**

We build two priority queues using the latest statistics data: one for
standalone tests, one for setup-linked tests. They are both "max heaps" sorted
by runtime, so that we can easily retrieve the slowest test from the top of
the heap. The setup-linked queue is only sorted by the total time of all tests
under each different setup. We chose a priority queue because it's
inexpensive to add and subtract items while maintaining the proper ordering.

**#2 Allocate setup-linked tests**

First, we compute a "shard budget" by simply dividing the total
non-parallelized runtime of the test suite by the number of shards we plan to
use. Then we pick the topmost group of tests from the setup-linked heap and
allocate its associated tests to the shard with the most free budget.
(Naturally we're using a separate min heap to maintain a list of our shards
ordered by remaining space.)

In the case where the total runtime of a single setup's associated tests
exceeds our budget, we split that setup across multiple shard; otherwise, our
final CI runtime could only be as fast as our slowest set of setup-linked
tests. More specifically, we assign as many tests as we can to the most-free
shard, then take the remaining tests and re-add them as a new test group in
our setup-linked queue. As the allocation algorithm progresses, they'll
eventually get assigned to an appropriate shard.

.. note::

  That said, we still try to be smart about setup-splitting; we don't split if
  the budget is only slightly exceeded or if the setup initialization process
  accounts for more of the total runtime than the tests themselves (in which
  case splitting would be unnecessarily wasteful, even if it provides
  marginally faster runtimes overall).

**#3 Allocate standalone tests**

To allocate the standalone tests, we follow a similar allocation methodology
on a single test level. The only difference is that, as we are close to the
end, we don't want to leave any tests behind. We distribute the tests as
evenly as possible until there is only one shard remaining with available
space. Then we "short-cirtcuit" and dump all the remaining tests into that
shard. These will mostly be tiny, fast-running tests, so it shouldn't affect
our Gini coefficient much.

The conquer
-----------

Now that we "evenly" split our tests, let's run them.

In the previous section, we described our methodology for sharding up the test
suite using a top-down approach. But more practically, how do we orchestrate a
parallel test runner?

The arbiter approach
^^^^^^^^^^^^^^^^^^^^

One idea is to have a single arbiter that runs our sharding algorithm, and
tells each runner which tests to run. This has some downsides: it's yet
another moving part and requires passing data/instructions around, which adds
complexity and bug surface.

The distributed approach
^^^^^^^^^^^^^^^^^^^^^^^^

We chose another approach. Each runner is fed the same statistics CSV and
independently executes the (completely deterministic) sharding algorithm.
Based on the shard ID it was assigned, the runner is able to determine which
tests it should run from the suite. "Distributed computing" without an
arbiter, yay!

This approach is still a bit scary as the sharding algorithm is non-trivial.
It's possible that a bug in the algorithm could result in some tests not being
executed at all. To address this, we added a final integrity check to ensure
all tests are executed. For the heck of it, we also compile the actual
runtimes of each test and upload it as a CSV for future reference.

Working with GitHub Actions
---------------------------

With all the pieces in place, implementing this with GitHub Actions is easy.
In a shared job called ``build``, we fetch the statistics CSV from
``gist.github.com`` and upload it as `artifact <https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts>`_
so it can be shared between jobs. (This job also builds EdgeDB, it's various
Rust and Cython extensions, and Postgres with the help of a caching
infrastructure that is a blog post for another day.) Then we declare our build
matrix, including each of our 16 shard IDs:

.. code-block:: yaml

  python-test:
    needs: build
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [
             1/16,  2/16,  3/16,  4/16,
             5/16,  6/16,  7/16,  8/16,
             9/16, 10/16, 11/16, 12/16,
            13/16, 14/16, 15/16, 16/16,
        ]

And run the tests:

.. code-block:: yaml

    - name: Test
      env:
        SHARD: ${{ matrix.shard }}
      run: |
        mkdir -p .results/
        cp .tmp/time_stats.csv .results/shard_${SHARD/\//_}.csv
        edb test -j2 -v -s ${SHARD} --running-times-log=.results/shard_${SHARD/\//_}.csv

The ``--running-times-log`` parameter is both an input and output. As an
input, it's the path to the sharding results, which is then overwritten by an
updated CSV containing the observed runtime for each test executed in this
shard. Once the tests have completed, the ``.results`` directory is uploaded
as an artifact.

Finally, a job called ``test-conclusion`` that runs a final integrity check.
This is all implemented as a `Python script <https://github.com/edgedb/edgedb/blob/9a1e036772ea79defdefa0862867d4dab8be35d4/.github/workflows.src/tests.tpl.yml#L174>`_
embedded in the GitHub Actions YAML file. It also takes compiles the full set
of results and updates the CSV with the latest runtimes, so the statistics are
fresh for the next run.

Conclusions
-----------

All told, our test suite now takes around 7 minutes to run (not counting the
pre-test build step), which is roughly 95% faster than a naive approach. Even
factoring in the fixed build process, our CI now runs 10x faster overall. Not
too shabby! GitHub Actions is remarkable versatile. With a bit of cleverness
it's possible to run sophisticated workloads in a remarkably performant way.
