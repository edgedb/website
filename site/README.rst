===========
EdgeDB.com
===========

This repository contains the code and the content necessary to generate
the EdgeDB web site, including the blog, documentation, tutorial and
Easy EdgeDB book.

We use Sphinx_ and Next.js_ to generate the Web content from ``.rst``
sources.

.. _Sphinx: http://www.sphinx-doc.org/
.. _Next.js: https://nextjs.org/


Requirements
============

- Python 3.8+
- Node.js 18+
- Yarn

Note: If developing on Windows, it is recommended to use WSL since the various
setup/build scripts assume a unix-like environment.

Installation
============

1. Clone the repository:

.. code-block:: shell

    $ git clone --recursive git@github.com:edgedb/edgedb.com.git

2. Install JS dependencies:

.. code-block:: shell

    $ yarn install

3. Reuse EdgeDB repos already on the system (optional step)

Symlink EdgeDB repos into ``./.repos``. Check ``setup.sh`` in the root of
this project to see which repos need to be present. You may skip this step to
allow setup to automatically clone all the repos for you.

4. Set up Sphinx

.. code-block:: shell

    $ yarn setup

Run ``yarn setup`` to automatically install sphinx and python deps,
clone the required repos to fetch the docs from, and create the config
files needed for sphinx docs building. Re-run ``yarn setup`` at any time
to pull the latest changes for each repo.

5. Set up the tutorial database (optional step)

By default, the website app is pre-configured to use the production
DB for running the local tutorial app. It is possible, though, to
configure it to use a local DB instance.

First create a new EdgeDB instance. You can name it anything; for
simplicity, we use the name ``tutorial`` below.

.. code-block:: shell

    $ edgedb instance create tutorial

When running the tutorial instance you'll need to set the
``EDGEDB_DEBUG_HTTP_INJECT_CORS`` environment variable to true (``1``)
and run the server in ``--foreground`` mode:

.. code-block:: shell

    $ edgedb instance stop -I tutorial
    $ env EDGEDB_DEBUG_HTTP_INJECT_CORS=1 edgedb instance start --foreground -I tutorial

Copy the contents of ``.env`` into a ``.env.local`` and
update ``NEXT_PUBLIC_EDGEDB_SERVER`` to ``http://localhost:<port>`` (you can find the instance port by running ``edgedb instance status --extended``), and ``NEXT_PUBLIC_EDGEDB_TUTORIAL_DB`` if you are not using the default ``edgedb`` database.

Finally, migrate the new 'tutorial' instance to the schema in
`content/tutorial/dbschema`:

.. code-block:: shell

    $ edgedb -I tutorial migrate --schema-dir content/tutorial/dbschema

and allow DDL in database with this commands

.. code-block:: shell

    $ edgedb -I tutorial
    edgedb> configure current database set allow_bare_ddl := cfg::AllowBareDDL.AlwaysAllow;
    edgedb> select cfg::Config {allow_bare_ddl}; # check if allow_bare_ddl is set to AlwaysAllow


6. Run ``yarn regenGrammar`` if there have been changes to the EdgeQL
   grammar. Skip this step otherwise.

7. For local development create `.env.local` file in your `/site` dir
   with the following content::

   NEXT_PUBLIC_CLOUD_URL="https://nebula-ui-staging.vercel.app"
   EDGEDB_PRICING_URL="https://api.g.aws-test.edgedb.cloud/v1/pricing"

8. Run ``yarn dev``. This will run all the build steps needed for the docs,
   blog, tutorial and Easy EdgeDB, then start the next.js dev server. It will
   also watch for changes in the source files and re-run build steps as needed.

.. code-block:: shell

    $ yarn dev

    # Can skip/only run certain build steps with the --skip or --only flags
    # with a comma separated list of any of: 'docs', 'blog', 'easyedb',
    # 'tutorial', 'nextjs'
    # For example, if you're only working on the docs and blog content, and
    # don't have the tutorial instance running, you can run the following to
    # skip building other parts of the site:
    $ yarn dev --skip easyedb,tutorial
    # ...or, for example, you're just writing a blog post:
    $ yarn dev --only blog,nextjs

9. To run a full build.

.. code-block:: shell

    $ yarn build

    # to serve static build
    $ yarn next start


Configuration
=============

Before running ``yarn dev``/``yarn build``, customize the paths in which
documentation sources are looked for by creating the ``build.config.ts`` file
in the root directory with the following content:

.. code-block:: typescript

    import {BuildConfig} from "./dataBuild/interfaces";

    const config: BuildConfig = {
        repoPaths: {
            edgedb: "<path-to-the-core-repo>",
            js: "<path-to-the-js-docs-repo>",
            python: "<path-to-the-python-docs-repo>",
            go: "<path-to-the-go-repo>",
            dart: "<path-to-the-dart-repo>",
            easyedb: "<path-to-the-easyedb-repo>",
        },
        // required when not manually running build inside virtual env
        sphinxPath: "<path-to-sphinx-build>"
    }

    export default config;

Fetch Tweets
------------

The tweets on the community page are loaded from the file
``./dataSources/twitter/tweetData.js``. This file is committed to the repo
and generated with the command ``yarn fetchTweets``. Before running this
command create a file at ``/buildScripts/fetchTweets/twitterAuth.config.ts``
with a default exported object containing a twitter api key/secret and
access token/secret (implementing the ``TwitterAuthConfig`` interface
from ``oauth.ts``).
Eg.:

.. code-block:: typescript

    import type {TwitterAuthConfig} from "./oauth";

    const config: TwitterAuthConfig = {
      apiKey: "...",
      apiKeySecret: "...",
      accessToken: "...",
      accessTokenSecret: "...",
    };

    export default config;


Remote EdgeDB Instance
======================

The tutorial runs on a remote instance that exists independently of
this repo. The instance is stateless as we discard all the changes we
do in the examples, however it still requires the schema and data to
be set up for us to use. This is done via appropriate migration
scripts found here:

https://github.com/edgedb/cloud/tree/master/docker/embedded/dbschema

Typically, if you're changing the tutorial database, you would first
make a local copy for testing the changes and then you can backup the
``dbschema`` both in this repo (as a reference) as well as in the repo
above (to make the changes live).
