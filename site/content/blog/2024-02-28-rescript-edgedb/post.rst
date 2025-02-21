.. blog:authors:: arizongabriel
.. blog:published-on:: 2024-02-28 10:00 AM PT
.. blog:lead-image:: images/splash.jpg
.. blog:lead-image-alt::
   The ReScript and EdgeDB logos on a red background, with a long diagonal line
   between them.
.. blog:guid:: 89dc9d43-3b94-4a70-b2a5-24d3c69a9159
.. blog:description::
   Learn how together ReScript and EdgeDB achieve full type safety with less
   busy work. This post shows you the benefits and how you can get started with
   this pairing today!


===================
ReScript and EdgeDB
===================

My name is Gabriel Nordeborn, and I work at `Arizon
<https://www.arizon.se/>`__. We're a tightly knit team of IT specialists who
combine consulting and contracting with building new companies together. We're
based in Stockholm, Sweden, but we do work all over the world.

I spend most of my time in the frontend, but I'm still a sucker for databases
and have a long (and mostly healthy) relationship with Postgres. However,
lately we've been picking up EdgeDB and using it successfully for critical
projects at Arizon. EdgeDB's experience is already fantastic, and it's getting
better by the day.

I'm also a core contributor to `ReScript <https://rescript-lang.org/>`__, a
programming language with a *fast* toolchain that compiles to JavaScript and
has an remarkable type system that makes building, scaling, and maintaining
products a joy.

In this post I'm going to tell you about how using ReScript and EdgeDB together
can give you code that's scalable, maintainable, performant, and ergonomic to
work with.

But, before diving into the fantastic world of EdgeDB, let me quickly introduce
what ReScript is and what it's capable of.


ReScript- "Fast, Simple, Fully Typed JavaScript from the Future"
================================================================

With a fully sound type system, great type inference, and a lightning fast
compiler, ReScript lets you build applications quickly, and then fearlessly
refactor them with no risk of unexpected breakages or runtime crashes. If it
compiles, it runs.

ReScript is a pragmatic language that focuses on shipping and getting things
done. Since ReScript compiles to JavaScript, you can use it anywhere you can
use JavaScript. This is one of the main powers of ReScript — it's just
JavaScript in the end. It runs anywhere JavaScript runs, whether that's on the
frontend, the backend, or any other device.


Interop with other JavaScript/TypeScript code is a top priority
---------------------------------------------------------------

While ReScript is its own language entirely, it's designed to integrate nicely
into your existing JavaScript applications with little effort and a small
footprint. This means it's easy to use your ReScript code from your
JavaScript/TypeScript code, and your JavaScript/TypeScript code from your
ReScript code.

Because of that, the buy-in required to use ReScript is minimal. You're up and
running very fast, and you can use it for as much or as little as makes sense
for your needs and your application. You don't need to rewrite your entire app
in ReScript (unless you want to of course). You can start with a single
function or a single component.


Compiling to JavaScript enables interesting features
----------------------------------------------------

However, since ReScript has its own syntax, type system, and compiler, it has a
bunch of interesting capabilities. Things like being able to give you ergonomic
and efficient syntax, tools, and concepts not expressible in regular JavaScript
but that the compiler can turn into optimized, efficient (and readable!)
JavaScript. In fact, ReScript code compiled to JavaScript is often *faster*
than hand-written JavaScript because the compiler can optimize things for you
automatically.

Combined with great type inference, this lets you write expressive,
maintainable, and clear code.

.. code-block:: javascript

    // inferred as: string => promise<option<user>>
    let getUserById = async userId => {
      switch await Api.userById(userId) {
      | Ok(user) => Some(user)
      | Error(err) =>
        Console.error(err)
        None
      }
    }


*An example of what ReScript looks like. Useful types like the result and
option types are built in, and you don't need type annotations but still get
100% type safety.*


Cool things ReScript can do
---------------------------

Here's a list of cool things that ReScript can do that will have a large impact
on your day-to-day work as a developer once you learn them:

.. lint-off

- `Pattern matching
  <https://rescript-lang.org/docs/manual/latest/pattern-matching-destructuring>`__.
  Once you've experienced good pattern matching, it's hard to go back to not
  having it.
- `pipe operator <https://rescript-lang.org/docs/manual/latest/pipe>`__
  (``->``) for clear and efficient function chaining.
- `Labelled, optional, and unlabelled function arguments
  <https://rescript-lang.org/docs/manual/latest/function#labeled-arguments>`__.
  No need to use intermediate objects as the function argument just to be able
  to set arguments in a non-fixed order.
- `Async/await <https://rescript-lang.org/docs/manual/latest/async-await>`__,
  just like in JavaScript, but `you can pattern match on it, and handle errors
  directly in your pattern match
  <https://rescript-lang.org/docs/manual/latest/async-await#error-handling>`__
  (no need for explicit try/catch).
- Powerful data modelling with `variants
  <https://rescript-lang.org/docs/manual/latest/variant>`__ and `records
  <https://rescript-lang.org/docs/manual/latest/record>`__.
- Type inference! Although rarely a good idea, the ReScript type system is
  powerful enough for you to write entire applications without a single type
  annotation if you're so inclined, but still get 100% type safety.

.. lint-on

.. code-block:: javascript

    // You can put switches and expressions anywhere, like here where we're
    // assigning a switch to a variable.
    let buttonClasses = switch (buttonSize, buttonType) {
    | (Large, Primary) => "btn-lg btn-primary"
    | (Large, Secondary) => "btn-lg btn-secondary btn-modifier"
    | (Small, Primary) => "btn-sm btn-primary-sm"
    | (Small, Secondary) => "btn-sm btn-primary-sm btn-modifier-sm"
    }

    // And you can put expressions anywhere, like in the middle of JSX. Pattern
    // matching is really good, and the compiler will make sure you always
    // handle all cases.
    <div>
      <button className=buttonClasses>
        {React.string(
          switch (loggedIn, productStock) {
          | (true, InStock | AlmostSoldOut) => "Order item"
          | (true, ComingSoon) => "Pre-order"
          | (false, _) => "Log in to order"
          }
        )}
      </button>
    </div>

*Another example of what ReScript looks like. Pattern matching is handy and
you'll use switches all the time in ReScript.*

We've of course barely scratched the surface of ReScript here, but this short
segment should be enough of a precursor to understand the rest of the article,
and how ReScript and EdgeDB can fit well together.

Let's have a look at the integration between ReScript and EdgeDB and what
synergies it brings.


EdgeDB and ReScript: move fast with confidence and minimal friction
===================================================================

EdgeDB is to Postgres a bit like what ReScript is to JavaScript for me: a much
improved and more ergonomic experience on top of a fantastic and powerful
technology.

As we go through how the ReScript and EdgeDB integration works, let me first
state what things I value when interacting with databases as I build
applications:

- I want to write in the actual query language of the database, not a custom
  DSL or through an ORM. Master the query language itself and learn to think in
  it, and your queries will be faster and more efficient. This is, in my
  opinion, what scales best, gives the most power, and enables the best
  tooling. (More on that in a bit.) In Postgres, I want to write SQL. In
  EdgeDB, that's EdgeQL.
- Types should be derived from the database itself. No hand-written types you
  have to sync manually.
- Types derived from the database should be automatically generated/derived and
  wired up for you. No manual plumbing, importing and wiring up the types, etc.
- Queries should be possible to *co-locate* with the code that's consuming the
  query. This makes local reasoning much easier and prevents queries from being
  reused because of laziness, which could easily lead to accidental coupling
  and invites overfetching (e.g., "I'll just select this one extra thing here
  in this generic query because I'm too lazy to make a dedicated query for this
  use case").

As you can see, it's the usual stuff: eliminate manual steps, derive types from
the source, and so on. Those who know me will testify I'm pretty boring and not
very original.

With that said, let's look at what using ReScript and EdgeDB looks like. Here's
a simple but complete example:

.. code-block:: javascript

    let findCompanyById = async (edgeDbClient, companyName) => {
      let query = %edgeql(`
        // @name FindCompany
        select Company {
          name,
          slug,
          employeeCount
        }
        filter .name = <str>$name
        limit 1
      `)

      switch await edgeDbClient->query({name: companyName}) {
      | Error(err) =>
        Console.error(err)
        None
      | Ok(company) => Some(company)
      }
    }

.. lint-off

Above is a function that searches for a company by name. It takes two
arguments, defines a (co-located) EdgeQL query, runs it, and returns the result
if it finds a company through an `option type
<https://rescript-lang.org/docs/manual/latest/null-undefined-option#sidebar>`__.

.. lint-on

Notice that this has no type annotations, yet it's 100% type safe. The return
value of this async function is inferred to be ``promise<option<company>>``
where the type of ``company`` is generated by the EdgeDB tooling from the
EdgeQL query itself.

Thanks to EdgeDB's great type generation capabilities and ReScript's type
system, ReScript can infer all the type information it needs just from how
things are used:

- ``edgeDbClient`` is an ``EdgeDBClient`` because it's being used with ``query``,
  which is a generated EdgeQL query that takes an ``EdgeDBClient``.
- ``companyName`` is a ``string`` because it's passed into the query variables
  at the ``name`` position, which is defined as a ``string`` in the types
  generated from the EdgeQL query.


Minimal manual plumbing and friction
------------------------------------

There's not much more to it than that. With the above, you have pretty much
everything you need. You can write EdgeQL co-located with the code that uses
it, the types are automatically derived for you and kept in sync, and what you
see is exactly what you get — no magic.

This is the whole basis for why this integration is ergonomic: because it means
you can change and evolve virtually anything in your application with minimal
friction but still maintain full safety. Make breaking changes in your queries
as much as you'd like, and EdgeDB + ReScript will guide you through fixing your
application.

As stated in the list of what I find important, this is really at the heart of
it: getting rid of manual steps and friction.


EdgeQL is powerful!
-------------------

And, perhaps the most important part is that you're using EdgeQL, the query
language that's at the core of EdgeDB. This means that what you see is what you
get — there's no magic or indirection. You write EdgeQL, which is first class
in EdgeDB, and the exact EdgeQL you wrote is what runs.

This also encourages you to let the database do more work. You can always
transform and work with your data in ReScript as you get it as well, but when
using EdgeQL, it's easy to do transformations, lookups, and the like where it's
the cheapest: right next to the data itself, in the database.


Tooling, tooling, tooling!
==========================

.. lint-off

For the workflow described above to *really* be ergonomic though, we need some
additional tooling. Therefore, we've built a `dedicated VSCode extension
<https://marketplace.visualstudio.com/items?itemName=GabrielNordeborn.vscode-rescript-edgedb>`__
that gives us a number of tools to improve the workflow. I'll go through the
most important ones here.

.. lint-on


In-editor errors
----------------

Errors should be in your editor, not hidden away in a terminal somewhere.
Therefore, any errors in your EdgeQL queries are propagated into your editor,
so finding them and taking action on them is easy:

.. edb:youtube-embed:: Uf_4yLUM7qc


Modifying, running, and exploring your queries in the native EdgeDB UI
----------------------------------------------------------------------

As previously stated, one of the main benefits of staying with EdgeQL is
WYSIWYG (what you see is what you get). You write EdgeQL, and exactly that
EdgeQL runs when you execute your code. This also means that running,
modifying, and analyzing your queries can be really easy. For that, the editor
tooling has an integration for opening your queries in the native EdgeDB UI so
you can run/modify/analyze the query before putting the updated query back in
your code with minimal hassle:

.. edb:youtube-embed:: -rAj884YRDk


Static analysis of unused EdgeQL selections — no more overfetching
------------------------------------------------------------------

ReScript has some `powerful static analysis tools
<https://github.com/rescript-association/reanalyze>`__. Thanks to that, we've
been able to build a CLI that can analyze your entire ReScript + EdgeDB
project and tell you exactly which selections in your various EdgeQL queries
are never used in your application. Since ReScript's type system is sound, this
is both simple and accurate.

This is a big asset, because you'll be able to instantly remove any
overfetching you might have, down on the property level. You can even run the
CLI in your CI to make sure no overfetching ever makes it to production. When
the CLI catches an overfetch, it looks something like this:

.. code-block::

    Analyzing project... (this might take a while)

    ✘ Found 3 unused selections.

    File "PageSingleCompany.res":
    - descriptions.company.name
    - descriptions.company
    - city.id

This functionality loops back to ReScript's ability to let you fearlessly
change things. Getting rid of overfetching is notoriously hard unless you can
get guarantees from something like static analysis, because you need to know
with 100% certainty that nothing else in your application is depending on the
fields you remove or else you'll break things.

.. note::

    This tooling will become even slicker in the future as a few new features
    land in EdgeDB UI.


EdgeDB tooling in the future
----------------------------

As EdgeDB ships more IDE tooling themselves, this experience will get a lot
better as well. EdgeQL autocomplete, refactors, code actions, and more will all
contribute to a great experience once they ship.


Summing up
==========

The tooling around using ReScript and EdgeDB together focuses on the most
important practical aspects:

- Providing full type safety with no manual plumbing needed.
- Staying close to the source (by using EdgeQL).
- Co-locating your DB code as much as you want with your application code that
  consumes it.
- Adding QoL features like in-editor errors and easily
  running/modifying/analyzing queries in the native EdgeDB UI.

Together, all of these aspects give you a simple, fast, ergonomic, and
efficient setup for querying your EdgeDB database safely in your applications.
This together with minimal friction and manual plumbing means you'll be able to
move faster and more confidently, both when building new apps and maintaining
what you already have. We've been using it with great success at Arizon.

EdgeDB's type generation capabilities and ReScript's strong type system means
you'll have the type system ensuring data flows in a safe way both into and out
of your database. But you don't have to take my word for it. Try
`rescript-edgedb <https://github.com/zth/rescript-edgedb>`__ yourself if any of
this sounds intriguing. We're happy to hear any feedback, good and bad!
