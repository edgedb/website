.. blog:authors:: colin
.. blog:published-on:: 2022-01-20 01:00 PM PT
.. blog:lead-image:: images/rc4.jpg
.. blog:guid:: b51d9b35-560f-4516-8a12-bbb3bf4a92db
.. blog:description::
    The final release candidate is now available. EdgeDB 1.0 is launching
    Feb 10th!


===================
EdgeDB RC4: Procyon
===================

EdgeDB's fourth and final release candidate—codename Procyon—is now
available!

This is a (nearly) pure release candidate. Outside of bug fixes and a
`non-breaking simplification
<https://github.com/edgedb/edgedb/pull/3243>`_ to ``for`` loop syntax, no
significant changes have been or will be made to EdgeDB before the 1.0 release.

.. important::
  Speaking of which, EdgeDB 1.0 is launching in a livestreamed event on February
  10th, 2022! We'll be dropping the release live on air, followed by a series of
  lightning talks from the team. Grab a ticket at
  `lu.ma/edgedb <https://lu.ma/edgedb>`_.



Windows support for CLI
-----------------------

Previously, the EdgeDB CLI relied on Docker to run local instances on
Windows. Since RC3 removed Docker support in favor of :ref:`portable builds
<ref_portable_builds>`, we temporarily dropped Windows support. Well,
it's back! The CLI now transparently uses Windows Subsystem for Linux (WSL)
under the hood; all documented CLI-based workflows will work out-of-the-box.


.. _ref_rc4_installation:

Upgrading/installation
----------------------


Installation (for first-time users)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Go through our 10-minute :ref:`Quickstart <docs:ref_quickstart>`; it'll walk
you through the process of installing EdgeDB, spinning up an instance, creating/
executing a migration, and running your first query.

Upgrading from RC2 or earlier
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If you're upgrading from RC2 or earlier (including any beta release), upgrading
requires a manual dump/restore process. Refer to the :ref:`RC3 upgrade guide
<ref_rc3_installation>` for detailed instructions.

Upgrading from RC3
^^^^^^^^^^^^^^^^^^

Run ``edgedb cli upgrade`` to get the latest version of the CLI. Then upgrade
your local instances.

- For project-linked instances, navigate to the root directory of your
  project and run ``edgedb project upgrade --to-latest``. This will install
  the latest version of EdgeDB, upgrade the instance, migrate the data, and
  update your ``edgedb.toml``.

- To upgrade an instance that isn't linked to a project, run
  ``edgedb instance upgrade <instance_name> --to-latest``.

Onwards and upwards
-------------------

This is the fourth and final release candidate; the first stable release is
launching February 10th, 2022! Register for the live launch event at
`lu.ma/edgedb <https://lu.ma/edgedb>`_ to witness the dawn of the post-SQL era!

For a full breakdown of the bug fixes and stability improvements in RC4,
check out the full :ref:`Changelog <docs:ref_changelog_rc4>`.

-----

.. important::
  Just getting started with EdgeDB? Check out the following resources.

  * If you're just starting out, go through 10-minute :ref:`Quickstart guide
    <docs:ref_quickstart>`.
  * To dig into the EdgeQL query language, try the web-based `interactive
    tutorial </tutorial>`_ — no need to install anything.
  * For an immersive, comprehensive walkthrough of EdgeDB concepts, check out
    our illustrated e-book `Easy EdgeDB </easy-edgedb>`_. It's designed to walk
    a total beginner through EdgeDB, from the basics all the way through
    advanced concepts.
