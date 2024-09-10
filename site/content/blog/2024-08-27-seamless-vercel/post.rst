.. blog:authors:: yury
.. blog:published-on:: 2024-08-28 10:00 AM PT
.. blog:lead-image:: images/splash.jpg
.. blog:guid:: 50D882C2-D0B0-4FCB-8C07-AF17A4F617AA
.. blog:description:: We're excited to announce the brand new seamless integration with Vercel

=======================
Seamless DX with Vercel
=======================

It's only been a couple months since we announced our Vercel integration.
Today, we're taking it to the next level. EdgeDB is part of the newly launched
`Vercel Marketplace <vercel_anno_>`_, alongside Redis and Supabase.

If you're a Vercel user, using EdgeDB is now as seamless as using
Vercel Postgres. Here are a few important notes:

* You can now use your Vercel account for seamless authentication with
  EdgeDB Cloud.

* Your EdgeDB Cloud usage will be included in your Vercel bill.

* Everything is auto-configured to run out of the box, eliminating any
  friction between your database and the app.


.. blog:gallery::
  .. figure:: images/vercel_storage.png

      Vercel Storage Popup

  .. figure:: images/vercelui.png

      Vercel Storage Usage

**Kicker**: the price to use EdgeDB remains the same, regardless of whether you access it
through Vercel or directly via `cloud.edgedb.com <https://cloud.edgedb.com>`_.


What Vercel users get
=====================

The new integration makes it incredibly easy to build and deploy EdgeDB
applications using Vercel's streamlined developer experience. Additionally,
EdgeDB Cloud integrates with GitHub and Vercel Preview deployments,
ensuring a seamless workflow.

With EdgeDB you can build `fast <perf_>`_, lean, and 100% type-safe
Next.js applications. The pain of database schema migrations, joins,
and access control disappears. Built-in Auth and AI extensions make it
possible to build production-grade systems in a matter of days or even hours.

Here are some links to Next.js / TypeScript guides to help you get started:

* `Generative UI with Vercel AI SDK and EdgeDB <genui_>`_
* `Stop building auth, start building apps with EdgeDB and Next.js <stop_auth_>`_
* `Building a simple blog application with EdgeDB and Next.js (App Router)​ <next_guide_>`_
* `Integrating EdgeDB with tRPC <trpc_>`_
* `The ultimate TypeScript query builder <qb_>`_


What's next for EdgeDB
======================

First up, we'll see you at `Next.js Conf <nextconf_>`_! EdgeDB is proud to be
a Gold Sponsor. Be sure to visit our booth and chat with us!

Next, EdgeDB's upcoming release is shaping up to be very exciting:

* SQL becomes a first-class citizen, making EdgeDB more accessible and
  compatible with the Postgres ecosystem—plus, we're infusing SQL with
  powerful new capabilities.

* Full PostGIS support, unlocking advanced spatial capabilities.

* Introducing LSP (Language Server Protocol), so your editor can fully
  understand and work with EdgeDB schemas.

* ``net`` module to make EdgeDB speak HTTP. Read the `RFC <net_>`_.

Plus, we'll be rolling out numerous improvements to EdgeDB Cloud,
the built-in UI, and other core components.


.. lint-off

.. _vercel_anno: https://vercel.com/blog/introducing-the-vercel-marketplace
.. _rauch_tweet: https://x.com/rauchg/status/1719128703970709888
.. _perf: /blog/edgedb-cloud-free-tier-how-we-stack-up-vs-planetscale-supabase-neon
.. _genui: /blog/generative-ui-with-vercel-ai-sdk-and-edgedb
.. _stop_auth: /blog/stop-building-auth-start-building-apps-with-edgedb-and-next-js
.. _next_guide: https://docs.edgedb.com/guides/tutorials/nextjs_app_router
.. _trpc: https://docs.edgedb.com/guides/tutorials/trpc
.. _qb: /blog/designing-the-ultimate-typescript-query-builder
.. _nextconf: https://nextjs.org/conf
.. _net: https://github.com/edgedb/rfcs/blob/master/text/1026-net-module.rst

.. lint-on
