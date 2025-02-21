.. blog:authors:: colin
.. blog:published-on:: 2021-05-06 02:59 PM PT
.. blog:lead-image:: images/edb_project_post.jpg
.. blog:guid:: cbb4ebfa-f27e-4983-85e5-d6b4b7c16d71
.. blog:description::
    We introduce "edgedb project", a new interactive command-line tool that
    makes it easier than ever to start new projects and configure existing
    ones.


===========================
Introducing EdgeDB Projects
===========================

.. _ref_projects:

We're excited to introduce a new interactive command-line tool that makes it
easier than ever to set up EdgeDB projects: ``edgedb project``.

If you want to try it right now, just :ref:`upgrade your CLI
<ref_appendix_a>` to the latest version (beta2 or later), open a
terminal, navigate to a project directory (or create a new one), and run
``edgedb project init`` inside.

This will open an interactive tool that will:

- Create a ``dbschema/schema.esdl`` file if it doesn't exist. This is where
  you will later define your application database schema.
- Create an ``edgedb.toml`` config file if it doesn't exist (more on that
  later).
- Prompt you to either create a new EdgeDB instance on your local machine or
  select an existing one.
- Create a **link** between that intance and your project directory. (More on
  that later too!)

And you're off to the races! Start writing your schema in
``dbschema/schema.esdl``, run a migration, and start writing queries.

Before we dig into how it works, let's talk about the problems we're trying to
solve.


The EdgeDB CLI experience
-------------------------

Our goal in building EdgeDB is to radically modernize the developer experience
of using a database. That philosophy extends to our command line tools as well.

The ``edgedb`` CLI is comprehensive, intuitive, quick to install, powerful, and
makes the adminstration of EdgeDB databases gloriously easy.

- You can install and manage multiple EdgeDB versions with ``edgedb
  server install``.
- You can spin up multiple instances with ``edgedb instance init``, each
  listening on a dedicated auto-assigned port.
- You can inspect all existing instances with ``edgedb server status``.

There's room for improvement
----------------------------

A few aspects of the EdgeDB developer experience are currently suboptimal.

Connection flags
^^^^^^^^^^^^^^^^

It's easy to spin up several active EdgeDB instances running simultaneously,
each listening on different ports. Unfortunately this flexibility introduces a
problem. When you run commands like ``edgedb migrate``, how does the CLI know
which instance it should run the command against? The answer: connection flags.

To open a REPL:

.. code-block:: shell

    $ edgedb -I my_instance

Currently, you are required to pass the ``-I instance_name`` flag to virtually
every top-level command: ``migrate``, ``dump``,
``restore``, and more. Not ideal.

Connecting to local instances
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

When developing an application with one of EdgeDB's client libraries, there are
a couple ways to connect to a local instance. You can either pass in an
instance name when creating a connection pool
(``edgedb.createPool("my_instance")``) or set the appropriate environment
variable (``EDGEDB_HOST`` or ``EDGEDB_INSTANCE``). Both options come with
difficulties and drawbacks.


Project portability
^^^^^^^^^^^^^^^^^^^

Most full-stack applications depend on the existence of a database—either local
or cloud-hosted—to function properly. The database is a dependency of your
application. Unfortunately it often requires a non-trivial configuration
process to set up a local database properly.

With modern package management tools, we can configure our *code dependencies*
in a single command with ``npm`` or ``pip``. Wouldn't it be great if it was
equally easy to configure a *database dependency*?


Introducing ``edgedb project``
------------------------------

We're thrilled to introduce our solution to all these problems: ``edgedb
project``.

How do I use it?
^^^^^^^^^^^^^^^^

First things first, upgrade your CLI to the latest version (beta2 or later,
:ref:`instructions here <ref_appendix_a>`).

You can now convert any directory into an EdgeDB project by running ``edgedb
project init`` inside it. This will create a ``dbschema/schema.esdl`` file (if
it doesn't already exist) and a new config file called ``edgedb.toml``.

After configuring your project, you'll no longer need to use connection flags.
So CLI commands like ``edgedb -I my_instance migrate`` become simply ``edgedb
migrate``. Similarly, the EdgeDB's first-party client libraries will be able to
automatically connect to the configured local instance, no hard-coded instance
names or environment variables required.

By checking in the ``edgedb.toml`` file to version control, you make your
EdgeDB-powered project trivial to configure for anyone with the ``edgedb`` CLI:
just clone, run ``edgedb project init``, and the project will be ready to run.
Pretty neat! 🎉

How does it work?
^^^^^^^^^^^^^^^^^

Running ``edgedb project init`` starts an interactive command line tool. You'll
see something like this:

.. code-block:: shell

    $ edgedb project init
    No `edgedb.toml` found in this repo or above.
    Do you want to initialize a new project? [Y/n]
    > y
    How would you like to run EdgeDB for this project?
    1. Local (native package)
    2. Docker
    > 1
    Checking EdgeDB versions...
    Specify the version of EdgeDB to use with this project [1-beta2]:
    > # left blank for default
    Specify the name of EdgeDB instance to use with this project:
    > my_instance
    Initializing EdgeDB instance...
    Bootstrap complete. Server is up and running now.
    Project initialialized.
    To connect, run:
    $ edgedb


Let's unpack that.

1. First, it asks you to specify an EdgeDB version, defaulting to the most
   recent version you have installed. You can also specify a version you
   *don't* have installed, in which case it will be installed.
2. Then it asks you how you'd like to run EdgeDB: locally, in a Docker image,
   or in the cloud (coming soon!).
3. Then it asks for an instance name. If no instance currently exists with this
   name, it will be created (using the method you specified in #2).
4. Then it **links** the current directory to that instance. A record of this
   link is stored in ``~/.edgedb/projects``—feel free to peek in that directory
   to see how it's represented.
5. Then it creates an ``edgedb.toml`` file, which marks this directory as an
   EdgeDB project.
6. Finally, it creates a ``dbschema`` directory and a ``dbschema/schema.esdl``
   schema file (if they don't already exist).

.. note::

    In the latest versions of EdgeDB, the location where credentials
    and project links are stored has changed. Run ``edgedb info`` to find where
    these files are stored on your system.

The ``edgedb.toml`` file
------------------------

The content of this file isn't terribly important; the most important thing
is simply that the file exists, since it's how the CLI knows that a directory
is an instance-linked EdgeDB project.

But since we're talking about it, ``edgedb.toml`` currently supports just one
configuration setting: ``server-version``, This lets you specify the EdgeDB
version expected by this project. The value in the created ``edgedb.toml`` is
determined by the EdgeDB version you selected during the setup process.

.. note::

    If you're not familiar with the TOML file format, it's a very cool,
    minimal language for config files designed to be simpler than JSON
    or YAML—check out `a short cheatsheet <https://toml.io/en/>`_.


How does this help me?
^^^^^^^^^^^^^^^^^^^^^^

In all sorts of ways! From inside an EdgeDB project directory (or in any of its
children), you can run CLI commands without connection flags. For instance,
``edgedb -I my_instance migrate`` becomes simply ``edgedb migrate``. The CLI
detects the existence of the ``edgedb.toml`` file, looks up the  project's
associated instance, and applies the command accordingly.

Plus, when you use one of EdgeDB's client libraries (for `TypeScript
<https://github.com/edgedb/edgedb-js>`_, `Python
<https://github.com/edgedb/edgedb-python>`_, `Rust
<https://github.com/edgedb/edgedb-rust>`_, or `Deno
<https://github.com/edgedb/edgedb-deno>`_), you no longer need to specify the
instance name:

.. code-block:: typescript-diff

      import edgedb from "edgedb";

    - const pool = edgedb.createPool("my_instance");
    + const pool = edgedb.createPool();


Like the CLI, the clients scan the filesystem for an ``edgedb.toml`` file and
look up which local instance they should connect to.


How do I use ``edgedb project`` for existing projects?
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If you already have an project on your computer that uses EdgeDB, follow these
steps to convert it into an EdgeDB project:

1. Navigate into the project directory (the one containing you ``dbschema``
   directory).
2. Run ``edgedb project init``.
3. When asked for an instance name, enter the name of the existing local
   instance you use for development.

This will create ``edgedb.toml`` and link your project directory to the
instance. And you're done! Try running some commands without connection flags.
Feels good, right?

How does this work for cloned projects?
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Let's say you just cloned a full-stack application that uses EdgeDB. The
project directory already contains an ``edgedb.toml`` file. What do you do?

Just run ``edgedb project init`` inside the directory! This is the beauty of
``edgedb project``. You don't need to worry about creating an instance with a
particular name, running on a particular port, creating users and passwords,
specifying environment variables, or any of the other things that make setting
up local databases hard. Running ``edgedb project init`` will install the
necessary version of EdgeDB (if you don't already have it installed), create an
instance, synchronize the database schema, and create the instance link. Then
you can start up the application and it should work out of the box.


How do I unlink a project?
^^^^^^^^^^^^^^^^^^^^^^^^^^

If you want to remove the link between your project and its linked instance,
run ``edgedb project unlink`` anywhere inside the project. This doesn't affect
the instance, it continues running as before. After unlinking, can run ``edgedb
project init`` inside project again to create or select a new instance.

Conclusion
----------

Hopefully that gives you a sense of how ``edgedb project`` works and how it can
make your life easier!

We are releasing ``edgedb project`` as part of EdgeDB Beta 2. If you haven't
already, upgrade to the latest version of the CLI using the instructions in
:ref:`Appendix A <ref_appendix_a>`.

If you're looking to get started with EdgeDB, jump into the :ref:`Quickstart
<docs:ref_quickstart>` or try our `interactive tutorial </tutorial>`_.

.. If you change this subheading, update the hash link in the intro that
.. references it (#appendix-a-upgrade-your-cli)

.. _ref_appendix_a:

Appendix A: Upgrade your CLI
----------------------------

If you haven't installed the CLI before, you can do so with a single command:

.. code-block:: shell

    # macOS/Unix
    $ curl https://sh.edgedb.com --proto '=https' -sSf1 | sh

    # Windows
    $ iwr https://ps1.edgedb.com -useb | iex

If you've already installed the CLI, upgrade to the latest version:

.. code-block:: shell

    $ edgedb self-upgrade
