.. blog:authors:: colin
.. blog:published-on:: 2021-12-02 01:00 PM PT
.. blog:lead-image:: images/rc3.jpg
.. blog:guid:: fca8a938-fcdf-4d8c-bb7a-bf07d8c0bd3c
.. blog:description::
    The third Release Candidate of EdgeDB is now available.


==========================
EdgeDB Release Candidate 3
==========================

EdgeDB's third release candidate is now available!

Though our previous RCs contained some minor new features, this is a
"pure RC". Outside of bug fixes and a `modified environment variable
<https://github.com/edgedb/edgedb/pull/3213/files>`_ no significant changes
have been or will be made to EdgeDB core before the 1.0 release, in the absence
of any show-stopping bug discoveries.

.. note::
  :class: aside

  To stay apprised of future releases, follow us on Twitter `@edgedatabase
  <https://twitter.com/edgedatabase>`_ or `on GitHub
  <https://github.com/edgedb/edgedb>`_.

  :blog:github-button:`href:https://github.com/edgedb/edgedb|size:large|title:EdgeDB`


As always, this release is named after a nearby star.
This time it's `61 Cygni <https://en.wikipedia.org/wiki/61_Cygni>`_ — a binary
star system about 11.4 lightyears from Earth which brags the greatest `proper
motion <https://en.wikipedia.org/wiki/Proper_motion>`_ of any star system
visible to the naked eye.

.. _ref_rc3_installation:

Upgrading
---------

The biggest change in RC3 isn't a change to EdgeDB itself, but how it's
packaged for local development usage. EdgeDB is now distributed as a "portable
build" that runs on any non-legacy Linux or macOS system, can be installed
anywhere on your file system, and doesn't require ``sudo``.

.. note::

  This change only affects local EdgeDB instances created with the CLI. For
  production deployments, we still build and distribute native packages for
  Debian/Ubuntu/CentOS, as well as a Docker image and other `system-specific
  options </install#linux-debianubuntults>`_.

This represents a departure from our previous approach of using native
distribution packages or Docker images; as a result, the process of upgrading
local instances to RC3 is slightly more involved than usual.


First: upgrade the CLI
^^^^^^^^^^^^^^^^^^^^^^

As always, the first step is upgrading to the latest version of our CLI. If an
older version is already installed, run ``edgedb cli upgrade`` to upgrade.
Otherwise follow the instructions in the :ref:`Quickstart
<docs:ref_quickstart>` to install it and spin up your first instance.

Identifying out-of-date instances
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

To see a list of all local instances running on an older (non-portable) build
of EdgeDB, run ``edgedb instance list --deprecated-install-methods``.
This list will include all previously-created instances running RC2
or earlier.

The upgrade flow differs slightly for :ref:`project-linked
<docs:ref_guide_using_projects>` and standalone instances.

Upgrading project-linked instances
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Upgrade project-linked instances with the following commands. Instead of a
single ``edgedb {project|instance} upgrade`` command (as with previous
releases), we are recommending "dump and restore" workflow that's more explicit
and less error prone. Future releases.

.. code-block:: shell

  $ cd /path/to/project
  $ edgedb dump --all --format=dir ./dump_dir
  $ edgedb project unlink --destroy-server-instance
  $ edgedb project upgrade --to-latest
  $ edgedb project init --no-migrations
  $ edgedb restore --all --admin ./dump_dir
  $ edgedb instance reset-password <instance_name>

This process dumps the contents of the database, unlinks the project, destroys
its associated instance, updates the ``edgedb.toml`` to reflect the latest
version, initializes a new project/instance running RC3, restores from dump,
and resets the instance password.

If you need to keep the same password, pass the ``--password`` flag to
``edgedb instance reset-password`` and enter the previous password at the
prompt.

The ``--all`` flag instructs the CLI to dump the contents of all databases, not
just the default database (called ``edgedb``). The project should be
re-initialized with the ``--no-migrations`` flag to prevent the CLI from
auto-executing the migrations found in ``dbschema/migrations``; ``edgedb
restore`` can only be executed against a fresh, schema-less instance.

Note that no explicit ``edgedb server install`` command is required; the CLI
will install RC3 on-demand during the ``edgedb project init`` flow.

Upgrading standalone instances
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

For standalone (non-project-linked) instances, follow the following steps. The
``<name>`` is the name of the instance; to see a list of all local instances
run ``edgedb instance list --deprecated-install-methods``.

.. code-block:: shell

  $ edgedb dump --all --format=dir -I <name> ./dump_dir
  $ edgedb instance destroy <name>
  $ edgedb instance create <name>
  $ edgedb restore --all --admin -I <name> ./dump_dir
  $ edgedb instance reset-password <name>


This process dumps the schema/contents of the instance, destroys it, creates a
fresh instance running RC3, restores the instance from the dump, and resets the
password to a new, generated value. If you need to keep the same password,
pass the ``--password`` flag to ``edgedb instance reset-password`` and enter
the previous password at the prompt.

An explicit ``edgedb server install`` command isn't required here. Instead, the
CLI will install the latest version of EdgeDB on-demand during the ``edgedb
instance create`` command.

Uninstalling old versions
^^^^^^^^^^^^^^^^^^^^^^^^^

Once all instances have been upgraded to RC3's portable builds, you can
uninstall the now-deprecated native packages.

.. code-block:: shell

  $ edgedb server uninstall --all --deprecated-install-methods

This command will skip any installation that is still in use by an existing
instance. You'll need to destroy or upgrade those instances before
uninstallation can occur.


.. _ref_portable_builds:

How portable builds work
------------------------

EdgeDB now ships as an executable build that can be installed anywhere on the
file system.

These portable builds of EdgeDB don't rely on OS-specific package management
systems like RPM or Debian packages. This frees EdgeDB from slotting
constraints imposed by such systems, which typically only allow a single minor
version to be installed at any given time. As we approach a v1.0
release, this becomes untenable; it should be possible to run
several instances running various 1.x versions simultaneously.

.. note::

  While this is a major change under the hood, the specifics of how EdgeDB is
  packaged should rarely be visible or relevant for non-advanced workflows.

Since the new portable builds can be installed and executed anywhere on the
file system, not just in OS-specified package directories like ``/usr/bin``,
installation no longer requires ``sudo`` access on any system.

Linux
^^^^^

To construct portable builds for Linux, EdgeDB is compiled in a
container running a stock CentOS 6 image (first released in 2011) containing
glibc v2.17. The resulting build is audited to guarantee no recent or
non-standard dependencies have been linked. Because ``glibc`` follows a strict
backwards-compatible `symbol versioning scheme <https://developers.redhat.com/blog/2019/08/01/how-the-gnu-c-library-handles-backward-compatibility>`_,
the resulting build will run in any environment containing ``glibc`` v2.17 or
later.

macOS
^^^^^

Similarly, macOS packages have been built against Apple's implementation of C (a
variant of BSD libc). This implementation also has strong backwards
compatibility guarantees; using the ``mmacosx-version-min`` build flag, we can
guarantee compatibility with OSX Yosemite and later.

For the moment, all builds are x86-based; a native ARM build is in the works.
These can be run on M1 Macs with Rosetta emulation with minimal performance
overhead.

Windows
^^^^^^^

There's no native build for Windows at the moment, though we plan to
distrubute one in the future. Instead, we recommend running local
instances using Docker and the `official EdgeDB image
<https://github.com/edgedb/edgedb-docker>`_.

Previously, running ``edgedb instance create`` in Windows used Docker behind
the scenes to run the new instance; this "magical" behavior is no longer
supported, as it was difficult to debug and configure. Instead, we suggest
using your preferred Docker workflow (``docker run``, Docker Compose, etc) to
spin up instances manually, then pass the appropriate connection information
into your application via environment variables.

Wrapping up
-----------

A fourth RC is likely, followed by a v1.0 release in January 2022—right around
the corner! Follow us on Twitter `@edgedatabase
<https://twitter.com/edgedatabase>`_ or
`GitHub <https://github.com/edgedb/edgedb>`_ to be notified when it drops.

To learn more about EdgeDB, check out the following resources:

* If you're just starting out, go through 10-minute :ref:`Quickstart guide
  <docs:ref_quickstart>`.
* To dig into the EdgeQL query language, try the web-based `interactive
  tutorial </tutorial>`_ — no need to install anything.
* For an immersive, comprehensive walkthrough of EdgeDB concepts, check out
  our illustrated e-book `Easy EdgeDB </easy-edgedb>`_. It's designed to walk
  a total beginner through EdgeDB, from the basics all the way through
  advanced concepts.

For a full breakdown of the bug fixes and stability improvements in RC3,
check out the full :ref:`Changelog <docs:ref_changelog_rc3>`.

:blog:github-button:`href:https://github.com/edgedb/edgedb|size:large|title:EdgeDB`
