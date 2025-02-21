.. blog:authors:: elvis yury
.. blog:published-on:: 2024-04-25 10:00 AM PT
.. blog:lead-image:: images/ai.jpg
.. blog:guid:: 119e8f62-2596-4158-bf8e-7b7bd1265068
.. blog:recommendations:: edgedb-cloud-free-tier-how-we-stack-up-vs-planetscale-supabase-neon, edgedb-5-introducing-branches, edgedb-5-introducing-passwordless-auth
.. blog:description::
    EdgeDB 5.0 introduces a new built-in extension that
    automates embeddings generation and bundles and exposes an easy way to do
    RAG with database queries as context.


=============================
EdgeDB 5: Introducing ext::ai
=============================

Back in EdgeDB 3.0 we, added support for storing and searching embeddings via
:ref:`the ext::pgvector extension <ref_ext_pgvector>` .

However, we felt that we can do much more than just simple vector storage and
search.  In EdgeDB, traditional full text search is as easy as adding an
``fts::index`` on the object of interest like so:

.. code-block:: edgeql

  type BlogPost {
    content: str;
    index fts::index on (
      fts::with_options(
        .content,
        language := fts::Language.eng
      )
    );
  }

and then do search like so:

.. code-block:: edgeql

  select fts::search(BlogPost, 'my query')

We are happy to announce that in EdgeDB 5.0 indexing and searching content
using semantic similarity is just as easy!

.. code-block:: sdl-diff

  + using extension ai;

    type default::BlogPost {
      content: str;
  +   deferred index ext::ai::index(
  +     embedding_model := 'text-embedding-3-small'
  +   ) on (.content);
    }

No more fiddling with embeddings! Just declare an index on a text property (or
any text expression), and you're now ready to easily perform semantic
similarity searches:

.. code-block:: edgeql

  select ext::ai::search(BlogPost, vector)

This works thanks to our new ``deferred index`` mechanism, also added in
EdgeDB 5.0. It allows for asynchronous index creation to avoid blocking object
mutation — the perfect solution for slow-going operations such as calling out
to a remote LLM over an API.

Speaking of the API, the ``ext::ai`` extension contains support for calling
into OpenAI, Mistral and Anthropic model APIs out of the box.  Of course, you
can plug any model as long as it exposes an OpenAI- or Anthropic-compatible
API (and more support is coming in future releases).

Having a generic way of doing semantic search over an arbitrary set of
objects opens the door to another great feature of the ``ext::ai`` extension:
RAG with database data as context!

RAGs to riches
==============

Code speaks for itself, so here's all you need to add a database-powered
RAG to your app:

.. code-block:: typescript

  import { createClient } from "edgedb";
  import { createAI } from "@edgedb/ai";

  const client = createClient();

  const gpt4AI = createAI(client, {
    model: "gpt-4-turbo-preview",
  });

  const blogAI = gpt4AI.withContext({
    query: "select BlogPost"
  });

  console.log(await blogAI.queryRag(
    "Were any of the blog posts about RAG?"
  ));

The new ``@edgedb/ai`` JavaScript package provides a convenient wrapper
for the ``ext::ai`` HTTP API, which, of course, can be used directly if that
better fits your needs:

.. code-block:: shell

  $ curl --json '{
      "query": "Were any of the blog posts about RAG?",
      "model": "gpt-4-turbo-preview",
      "context": {"query":"select BlogPost"},
      "stream": true
    }' https://edgedb-host:port/branch/main/ai/rag

Most generative LLMs are quite slow, so good UX demands support for output
streaming, which can be requested by passing ``"stream": true`` like in
the example above.

.. note::
    Don't forget to `authenticate
    <https://docs.edgedb.com/libraries/http#authentication>`__ your HTTP request!

What's next?
============

The EdgeDB 5 ``ext::ai`` extension allows building AI-enabled apps in minutes,
and we are working to make it even more powerful by adding

* definitions for more models and providers
* better integration with `Vercel's AI SDK
  </blog/generative-ui-with-vercel-ai-sdk-and-edgedb>`__
* guides, tutorials, and example projects

To try the new ``ext::ai`` extension now, start by `creating a new EdgeDB Cloud instance <cloudgo_>`_!

Ah, almost forgot. We've updated our built-in UI to let you have
a conversation with your database:

.. image:: images/ui.mp4
   :align: center

.. _cloudgo: https://cloud.edgedb.com
