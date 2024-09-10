.. blog:published-on:: 2024-04-10 10:01 AM PST

==========================================
Simplify EdgeDB CLI in JavaScript Projects
==========================================

Many parts of the EdgeDB workflow involve using our CLI, and installing the CLI is the very first step in starting to use EdgeDB. Today, we're making it easier than ever to install and invoke the EdgeDB CLI for JavaScript projects.

We now provide a wrapper script as a ``bin`` entry in our JavaScript package published to npm. This wrapper will:

1. Install the CLI if it's not already installed
2. Invoke the CLI with the arguments you pass to it

This approach eliminates the need to manually set up your ``PATH`` after installation and can simplify CI/CD workflows.

Here's how to use it:

.. code-block:: bash

   $ npx edgedb project init
   # or with yarn
   $ yarn edgedb project init
   # or with pnpm
   $ pnpm exec edgedb project init

Additionally, if you have scripts defined in your ``package.json``, any invocation of ``edgedb`` will be forwarded to the wrapper script, which will install and/or call the CLI for you.

For example, you might have defined a ``migrate`` run-script that runs the code generator after migrating your database:

.. code-block:: json

   {
     "scripts": {
       "generate:querybuilder": "generate edgeql-js",
       "generate:interfaces": "generate interfaces",
       "generate:queries": "generate queries",
       "generate:all": "$npm_execpath generate:querybuilder && $npm_execpath generate:interfaces && $npm_execpath generate:queries",
       "migrate": "edgedb migrate && $npm_execpath generate:all"
     }
   }

Running this ``migrate`` run-script with your package manager's script runner will now invoke this wrapper script.
