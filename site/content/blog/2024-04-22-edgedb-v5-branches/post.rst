.. blog:authors:: yury victor
.. blog:published-on:: 2024-04-23 10:00 AM PT
.. blog:lead-image:: images/splash.jpg
.. blog:lead-image-alt::
   V5 / Launch Day 2 / Branching
.. blog:guid:: ae80ef13-916d-4599-b73e-2f738b16b279
.. blog:recommendations:: edgedb-cloud-free-tier-how-we-stack-up-vs-planetscale-supabase-neon
.. blog:description::
   EdgeDB 5 comes with support for schema and data branches.


==============================
EdgeDB 5: Introducing branches
==============================

.. raw:: html

    <p style="font-size:120%">
      Welcome to the second day of EdgeDB 5 and EdgeDB Cloud launch week!
    </p>


OK, let's be clear: we'd rather cut off our left hand than give up ``git``.
It's become so essential for the modern development that it's hard to
imagine living without it. However, there's a catch: any complex project
involves a database, and more often than not, this throws a wrench into your
perfect git workflow.

It's 2024, and while running databases in the cloud has mostly been
figured out, developing rapidly with them is still challenging. Somehow
databases often find ways to be orthogonal to your tools and the rest of
your tech stack. At EdgeDB, we've been on a mission to change this:

* offer a one-liner to install the database tooling in seconds;
* provide a Swiss-army knife CLI to manage local and cloud databases;
* ship a built-in rich graphical UI, great docs, a powerful schema & query
  language, and high-quality client libraries, because why not.

One area we hadn't yet improved was the multi-feature workflow, where you or
your teammates sprint on multiple different ideas in parallel. Well, until now,
anyway—EdgeDB 5.0 is out today, and one of its big new features is schema and
data branches.


Branches in EdgeDB 5
====================

With EdgeDB 5, we're rethinking the concept of a "database" within a database
server (goodbye '70s!) to a "branch." This change not only simplifies our
vocabulary but also shifts our mindset, opening up a host of possibilities
for the tools we can now build. On the low level, the ``CREATE DATABASE``
DDL command has been replaced with ``CREATE BRANCH``. On the high-level,
most users will interact with branches through the CLI and graphical UI,
with commands like:

.. code-block:: shell

    $ edgedb branch --help
    Manage branches

    Usage: edgedb branch <COMMAND>

    Commands:
    create   Creates a new branch
    switch   Switches the current branch to a different one
    list     List all branches
    current  Prints the current branch
    rebase   Creates a new branch that is based on the target branch,
             but also contains any new migrations on the current branch.
    merge    Merges a branch into this one via a fast-forward merge
    rename   Renames a branch
    drop     Drops an existing branch, removing it and its data
    wipe     Wipes all data within a branch

Starting with EdgeDB 5, new projects automatically create a ``main`` branch.
Initially, the main branch is simply the starting point—the default and sole
branch. However, with the ``edgedb branch`` CLI commands, you can effortlessly
create new branches and switch to them. The branch you switch to then becomes
the default for all tools—and your code—to connect to and interact with,
unless explicitly overridden. This last bit is crucial: the EdgeDB branching
workflow is seamless, supported by our tooling and client libraries with zero
configuration required by the user.


The workflow
============

Let's do a quick overview of the new ``edgedb branch`` command.

Creating branches
-----------------

Creating a database branch involves more decisions than creating a code branch:

- The ``edgedb branch create`` command clones the current project branch
  with the schema, but it leaves out the data.

- The ``edgedb branch create --copy-data`` command clones the current project
  branch **with** all its data. Note that copying data might take some time for
  large databases.

- The ``edgedb branch create --empty`` command creates a brand new branch
  with no data and an entirely empty schema.

Switching branches
------------------

Once a branch is created, you can synchronize it with your code branch by
switching the corresponding EdgeDB branch using the single CLI command
``edgedb branch switch``. Use the ``-c`` or ``--create`` flag to branch out
and switch in one command.

Switching branches notifies all EdgeDB tools and libraries to connect to
the new default branch. This *seamless transition* means that no code changes
are necessary to connect to a different branch, eliminating the need to
manage separate configurations or worry about development branch names
leaking into your code-base.

Listing all your databases branches is as simple as running
``edgedb branch list``. To integrate the active branch into your shell's
prompt (``PS1``), use ``edgedb branch current``.

Rebasing and merging
--------------------

When you're ready to merge a feature into the main code base, your VCS
will handle *code* changes. However, databases are different—their schema
changes and migration order greatly influence the final state. To ensure the
consistency of your schema changes we require rebasing the feature branch on
top of the main branch before merging, aligning all migrations in the correct
order.

Rebasing a database branch on top of another involves analyzing
their migrations to detect where they diverge. The current branch is
transformed as if it had originated from the base branch incorporating all
subsequent migrations. This ensures the current branch appears as a direct
upgrade from the base, making a fast-forward merge possible.

The rebase process not only tests the compatibility of the branches before
the final merge—vital because database merges are not as easily reversible
as code merges—but also maintains alignment during development,
avoiding surprises when merging the branches.

The ``edgedb branch rebase`` command performs a rebase for the current branch
to bring it "in sync" with the other branch. Once two branches are aligned,
they can be merged confidently using ``edgedb branch merge``.


How is it different from X?
===========================

Other database products typically tie their branching capabilities to their
cloud solutions. This is where EdgeDB's commitment to seamless operation
**both** locally and in the cloud truly pays off. Developing with both your
backend and database running on your laptop is significantly more convenient
and efficient, allowing you to work independently of your internet
connection quality.

Moreover, the integration of EdgeDB tooling with EdgeDB Cloud, and services
like GitHub and Vercel (more on it soon!), enables a remarkably quick
development, preview, and production cycle. This significantly enhances
the overall development experience. Isn't that a big win? 😉

EdgeDB 5 is out, go build with it! And the launch week continues, see you
tomorrow! 💕
