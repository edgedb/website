.. blog:authors:: dave
.. blog:published-on:: 2023-09-28 10:00 AM PT
.. blog:lead-image:: images/rust-edgedb.jpg
.. blog:guid:: 8B4D588D8-E725-49D1-832E-7B0FC09E1133
.. blog:description::
   EdgeDB is tied to Rust, in part because some of it is written in Rust, but
   the surprising similarities between the two are found in other areas and run
   much deeper.

==========================================
EdgeDB and Rust: Type-safe kindred spirits
==========================================

EdgeDB has developed a relationship with Rust over its five-year history,
and as an open-source database, this relationship is easy to see. A quick
search through its repos shows that the
`EdgeDB CLI <https://github.com/edgedb/edgedb-cli>`_ was rewritten in Rust
in early 2020, right when Rust began to demonstrate its staying power as a
language. Rust clearly wasn't going to just be a flash in the pan, and
EdgeDB quickly jumped on the opportunity to benefit from rewriting
one of its most important tools. More recently the EdgeDB parser `has
been rewritten in Rust <https://github.com/edgedb/edgedb/pull/5693>`_,
and Rust continues to play a growing role in EdgeDB's codebase.

That said, more Rust code doesn't necessarily imply a larger affinity for Rust
itself. After all, you could use Rust to build a language that is its polar
opposite!

But EdgeDB found a kindred spirit in Rust because the two share a belief (and a
correct one!) in strong typing and expressiveness. These principles shift much
of the burden of writing and maintaining correct code from you, the developer,
to the programming language where it belongs. Both EdgeDB and Rust believe that
you should be able to write code that fits what you intend to build, without
having to expend precious mental energy on type safety and correctness.
Wherever possible, this burden should be carried by the compiler, not you.


Why strong typing is good
-------------------------

As the saying goes, programming languages are strongly typed at one
level or another. The only difference is where the types are kept:
inside your code in a statically-defined fashion, or *inside your mind*.

In the latter case, they also need to be kept in the minds of each and every
other developer working on your project!

One way to conceptualize the benefits of strong typing is by bringing
up its antithesis: JavaScript. The most famous example of JavaScript's
“anything-goes” nature is the one where it happily adds the number ``1``
to the string ``"1"`` for you, outputting ``11`` instead of an error,
or instead of ``2``. But if you *subtract* “1” from 1, it will return a 0.

.. code:: javascript

   console.log(1 + "1");
   // Output: 11
   console.log(1 - "1");
   // Output: 0

JavaScript follows its own rules as it was designed, and in this case
there is an internal reason: the ``+`` operator is overloaded to
concatenate strings, while the ``-`` operator is *not* overloaded so it
recognizes “1” as a number in the second case.

But good luck remembering this along with each and every other idiosyncrasy in
a language that famously allows the developer to do just about anything. You
might know this and JavaScript's other quirks by heart… but do all of your
collaborators?

Since JavaScript is so lenient, it's now the *developer's* job to remember and
predict every instance of unexpected behavior. It's no surprise that TypeScript
has taken off as more and more JavaScript developers see that some extra typing
up front pays for itself later on as a code base grows in size and complexity.

The same goes for databases as well, many of which lack a defined schema,
and use loosely-defined data types, nulls, and so on. All of these cases
result in extra mental overhead for the developer. When you successfully
insert some data into a loosely-defined database, did the insert work
because the object was constructed as intended or did the database just allow
it because its data types are so loosely defined that anything goes?

Choosing type safety — which is core to EdgeDB — lets you put an end
to this gnawing doubt.

But it goes well beyond just type safety. Let's look at how EdgeDB and Rust's
other similarities match up in practice. Oftentimes a feature of EdgeDB will
match exactly with one in Rust, and other times they will be close with some
notable differences. And sometimes EdgeDB will have a feature that, while not
identical or close to one in Rust, serves well as an analogy to understand the
other. This post contains a mixture of all three.

Let's start with the simplest data types used in EdgeQL (EdgeDB's query
language) and how they match up with the primitive types used in Rust.

Scalar (primitive) types
------------------------

EdgeDB has a large variety of `scalar data
types <https://www.edgedb.com/docs/stdlib/index#scalar-types>`_, many
of which overlap with those in Rust.

+---------------------------+-----------------------+-----------------------+
| EdgeDB                    | Rust                  | Notes                 |
+===========================+=======================+=======================+
| ``int16``                 | ``i16``               |                       |
+---------------------------+-----------------------+-----------------------+
| ``int32``                 | ``i32``               |                       |
+---------------------------+-----------------------+-----------------------+
| ``int64``                 | ``i64``               |                       |
+---------------------------+-----------------------+-----------------------+
| ``float32``               | ``f32``               |                       |
+---------------------------+-----------------------+-----------------------+
| ``float64``               | ``f64``               |                       |
+---------------------------+-----------------------+-----------------------+
| ``bigint``                | ``BigInt``            | `numbigint <http      |
|                           |                       | s://docs.rs/num-bigin |
|                           |                       | t/latest/num_bigint/s |
|                           |                       | truct.BigInt.html>`_  |
|                           |                       | crate                 |
+---------------------------+-----------------------+-----------------------+
| ``decimal``               | ``Decimal``           | `decimal <https://d   |
|                           |                       | ocs.rs/rust_decimal/l |
|                           |                       | atest/rust_decimal/st |
|                           |                       | ruct.Decimal.html>`_  |
|                           |                       | crate                 |
+---------------------------+-----------------------+-----------------------+
| ``json``                  | ``serde_json::Value`` |                       |
+---------------------------+-----------------------+-----------------------+
| ``array``                 | ``Vec``               | Items must be all the |
|                           |                       | same type, as in Rust |
+---------------------------+-----------------------+-----------------------+
| ``std::datetime``,        | ``Datetime<Utc>``,    | `chrono               |
| ``cal::local_datetime``,  | ``NaiveDateTime``,    | <https://docs.rs/chro |
| etc.                      | etc.                  | no/latest/chrono/>`_  |
|                           |                       | crate                 |
+---------------------------+-----------------------+-----------------------+
| ``bytes``                 | ``[u8]``, ``Vec<u8>`` |                       |
+---------------------------+-----------------------+-----------------------+
| ``tuple``                 | ``tuple``             |                       |
+---------------------------+-----------------------+-----------------------+

EdgeDB will refuse to mix one type with another:

.. code-block:: edgeql-repl

   db> select '9' + 9;

   error: InvalidTypeError: operator '+' cannot be applied to
   operands of type 'std::str' and 'std::int64'
     ┌─ <query>:1:8
     │
   1 │ select '9' + 9;
     │        ^^^^^^^ Consider using an explicit type cast or
     │        a conversion function.

Both Rust and EdgeDB offer a bit of flexibility here. Note in the
following example that Rust will still compile even though the
first 10.0 would normally be interpreted as an ``f64``:

.. code:: rust

   let num1 = 10.0;
   let num2 = 9.0f32;
   println!("{}", num1 + num2);

Rust sees that the 10.0 needs to be added to an ``f32`` and thus ``num1``
becomes an ``f32`` and not an ``f64``, which otherwise is the default
type for floats.

EdgeDB offers a similar flexibility, using what are known as `implicit casts
<https://www.edgedb.com/docs/reference/edgeql/casts#implicit-casts>`_. These
allow the next query adding two different numeric types to work:

.. code-block:: edgeql-repl

   db> select 9.1 + 9;
   {18.1}

The implicit casts that EdgeDB uses can be seen in `our casting
table <https://www.edgedb.com/docs/reference/edgeql/casts#casting-table>`_
where theys are marked with ``impl``. An implicit cast will take place
in operations involving two different numeric types in which one is more
precise than the other, ensuring that no information is lost.

The Rust equivalent here would require some more intervention: ``9.1 + 9 as
f64`` or ``9.1 + (f64::from(9))`` or any of the other numerous ways to do it.

The strong typing in the case of the EdgeDB query can be proven by
asking it whether the final type is a ``float64`` or an ``int64``:

.. code-block:: edgeql-repl

   db> select (9.1 + 9) is float64;
   {true}
   db> select (9.1 + 9) is int64;
   {false}

Or you can use a fancier query with the ``introspect`` keyword to
display the type name itself.

.. code-block:: edgeql-repl

   db> select introspect (typeof (9.1 + 9)) { name };
   {schema::ScalarType {name: 'std::float64'}}

In either case, the end result is a strongly typed ``float64``.

So far, so good, and strong typing when a value exists is an obvious plus. But
how does EdgeDB work in the *absence* of values?


There is no ``NULL``
--------------------

``NULL`` does not exist in Rust (well, except for `unsafe
Rust <https://doc.rust-lang.org/nomicon/what-unsafe-does.html>`_), and
EdgeDB doesn't use it either. A Rust developer certainly won't need to
be convinced of the disadvantages of having null in a language, but null
in databases has its own special pitfalls that are quite… interesting.
`Our SQL comparison blog post
<https://www.edgedb.com/blog/we-can-do-better-than-sql#null-a-bag-of-surprises>`_
sums up some of the quirks of ``NULL`` as used in SQL that make the developer's
life more interesting in all the wrong ways:

-  ``NULL`` is so special that it's not equal to anything, including itself.
-  Any operation on ``NULL`` will return ``NULL`` and the effect may be very
   subtle.
-  Yet in some cases ``NULL`` is equal to itself, such as in ``DISTINCT``.
-  Much of the traditional logic and boolean algebra rules cannot be
   safely applied to SQL boolean expressions in the presence of ``NULL``.
   For example, the law of excluded middle (i.e., either a proposition or its
   opposite must be true; ``p OR NOT p``), does *not* hold true if ``p``
   is ``NULL``.
-  Rows containing ``NULL`` sometimes get counted… and sometimes not!

.. image:: images/null-troubles.gif
    :alt: A seated man sweats as he looks at a screen showing a query that says
          SELECT COUNT(product_id) FROM product. Result: 3. We cut to another
          shot of his face in which he makes a change on the device. We cut
          back to the screen to see the query SELECT COUNT(*) FROM product.
          Result: 33. Cut back to the man's face, and he is now crying.

-  Rows containing ``NULL`` cannot be compared…
-  Even trying to check with ``IS NULL`` doesn't work.
-  Databases often uses ``NULL`` to indicate an error condition, so your
   query might contain ``NULL`` even if you don't expect it.
-  In PostgreSQL division by zero is an exception, whereas MySQL simply
   returns ``NULL``…

And so on and so forth. Using a database that does not use ``NULL`` is a big
advantage in and of itself!

However, programming languages still need to take into account the
possibility that a value will not exist. Here is how Rust and EdgeDB do it:

-  **Rust**: No concept of a magical ``NULL`` value. Instead,
   Rust offers something much better: the standard ``Option`` type,
   the values of which can either be ``None`` or ``Some(value)``.

-  **EdgeDB**: No concept of a magical ``NULL`` value either. The query
   language and data model are designed to operate on sets.
   When there's no data you have… an empty set: ``{}``.

While not the same construct, Rust's ``Option`` and EdgeDB's empty set have
fairly similar behavior.

For example, Rust allows you to work with and compare an ``Option`` that
is ``None``, but it has to be able to determine the type (the ``T``
inside ``Option<T>``). If it can't determine the type from the context,
you will have to let the compiler know:

.. code:: rust

   fn main() {
     // These are fine - Rust can determine the type
     assert_eq!(Some(9).or(None), Some(9));
     assert_eq!(None.or(Some(9)), Some(9));

     // But here it will complain without the ::<i32>
     assert_eq!(None::<i32>.or(None), None);
     // Same here
     assert!(None::<i32> == None);
   }

EdgeDB works more or less in the same way, as an empty set can be
compared to another set as long as the type is specified.

Note that here the coalescing operator (the ``??`` operator) is used to
skirt the rule of Cartesian operation that the product of anything with
an empty set (length 0) is always an empty set. Coalescing is roughly
equivalent to ``.or()`` or ``.unwrap_or_default()`` in Rust.

.. code-block:: edgeql-repl

   db> select 9 ?? <int32>{};
   {9}

   db> select <int32>{} ?? 9;
   {9}

   db> select <int32>{} ?? <int32>{};
   {}

EdgeDB will complain if it can't determine the type of an empty set, just as
Rust will with a ``None`` of an unknown type.

.. code-block:: edgeql-repl

   db> select {} ?= {};

   error: InvalidTypeError: operator '?=' cannot be applied to
   operands of type 'anytype' and 'anytype'
     ┌─ <query>:1:8
     │
   1 │ select {} ?= {};
     │        ^^^^^^^^ Consider using an explicit type
     │        cast or a conversion function.

   db> select <str>{} ?= <str>{};
   {true}

With a few of the basics out of the way, let's move back to the bigger
picture for a bit. What exactly *is* EdgeDB and is there an easy way to
describe it in general? Fortunately, EdgeDB and Rust more or less share
the same design here, making it easy to explain.


EdgeDB is to Postgres as Rust is to LLVM
----------------------------------------

Neither the architects of EdgeDB nor Rust chose to build everything from
scratch. Thanks to `LLVM <https://llvm.org/>`_, Rust didn't need to build its
own codegen backend and was able to latch itself to an established technology
from the get go. Theoretically Rust could have tried to build its own backend,
but why would it? LLVM continues to develop on its own accord, without any need
for those developing the Rust language to sacrifice their time to make it
happen.

EdgeDB made the same decision when it chose Postgres as its backend.
Interestingly, we can simply refer to the page on `why Rust
chose to use LLVM for code
generation <https://rustc-dev-guide.rust-lang.org/backend/codegen.html>`_
to answer why EdgeDB opted for Postgres instead of building everything
from scratch:

.. pull-quote::

   We don't have to write a whole compiler backend. This reduces
   implementation and maintenance burden. We benefit from the large
   suite of advanced optimizations that the LLVM project has been
   collecting.

The same quote works almost verbatim to explain the relationship between
EdgeDB and Postgres! Changing "compiler" to "database" and "LLVM" to "Postgres"
would suffice.


If it migrates, it works
------------------------

Rust's compiler is famously difficult to satisfy, but its benefits are
insurmountable: code that satisfies the compiler has effectively been debugged
ahead of time. More lenient programming languages allow less vigorous code to
be run, but this simply moves any errors from compile time to runtime. At the
end of the day this is a much less pleasant experience.

Moving as much as possible to compile time is often known as "if it compiles,
it works." Refactoring is, for the most part, a pleasure in Rust: first you
make your changes, then ask the compiler what broke, and then make fixes
until the code compiles again. The work up front is worth it for the extra
peace of mind down the road.

EdgeDB uses the same approach when handling migrations, by not allowing a
migration to proceed unless type safety, constraints, and assertions are all
upheld. This is easiest to see with a simple example. Note how similar it
feels to refactoring in Rust!

Let's first start with this schema with a single type.

.. code-block:: sdl

   module default {
     type Person {
       required name: str;
       nickname: str;
     }
   }

We then insert three ``Person`` objects: one named Moghedien, and two named
Mat Cauthon. Mat has a nickname, Moghedien doesn't.

.. code-block:: edgeql-repl

   db> insert Person { name := "Moghedien" };
   {default::Person {id: … }}

   db> insert Person { name := "Mat Cauthon", nickname := "Matty" };
   {default::Person {id: … }}

   db> insert Person { name := "Mat Cauthon", nickname := "Matty" };
   {default::Person {id: … }}

Now let's change the schema a bit. This time we would like ``nickname`` to
be ``required``, and ``name`` to have an ``exclusive`` constraint so that
no two ``Person`` objects can have the same name:

.. code-block:: sdl

   module default {
     type Person {
      required name: str { constraint exclusive }
      required nickname: str;
     }
   }

These changes are small but have consequences. What happens to the existing
``Person`` objects without a ``nickname`` that need one now? And what about
those with the same ``name`` as another?

Fortunately, EdgeDB has our back here. Similar to typing ``cargo check`` to
see what broke, we can type ``edgedb migration create`` and see what EdgeDB
thinks of the changes we are trying to make.

::

   Please specify an expression to populate existing objects
   in order to make property 'nickname' of object type
   'default::Person' required

EdgeDB is not satisfied, but provides a helping hand: what expression should
it use for any objects that don't have a ``nickname``?

This is essentially the same as ``.unwrap_or_default()`` in Rust.
Let's just type ``.name ++ 'y'``. This will take the name of any ``Person``
object and add 'y' to make a ``nickname`` if it doesn't have one already.

After this the migration works, and a script is generated. But we haven't
applied it yet. At this stage EdgeDB will try to apply our changes to the
existing database.

::

   Detail: property 'name' of object type 'default::Person'
   violates exclusivity constraint

Once again, EdgeDB is not yet satisfied because more than one of the ``Person``
objects has the same name. Here we can just delete one of our ``Person``
objects named Mat Cauthon, and now the migration can be applied. All ``Person``
objects have a ``nickname``, and none of them have the same name, as we
specified in the schema.

As you can see, a little work up front saves us from a lot of headaches
down the road.


Abstractions and performance, hand in hand
------------------------------------------

One of the reasons for Rust's success is that it allows a high degree
of expression without sacrificing performance. Much of this is thanks to
not having a garbage collector, but also its *zero-cost abstractions*:
abstractions in your code that have no overhead and are thus no less
performant than if you had coded everything by hand.

Here's a quick example of that: an iterator. Iterator methods in Rust are
expressive, plentiful, and often chained one after another.

.. code:: rust

   fn main() {
     let iter = [Some(1), Some(2), None, Some(3)]
       .into_iter()
       .flatten()
       .inspect(|num| println!("Number: {num}"))
       .map(|num| num + 1)
       .filter(|num| num % 2 == 0);
   }

Interestingly, the resulting type isn't a ``Vec<i32>`` but something a
lot longer: it's more like a
``Filter<std::iter::Map<Inspect<Flatten<std::array::IntoIter<std::option::Option<i32>, 4>>, closure>, closure>, closure>``.

Instead of six separate operations, the code above simply creates a nested
structure that needs to be called only once. In this code it hasn't even been
called yet, as iterators are lazy by default.

EdgeDB uses a similar practice, thanks to a protocol that is designed
to minimize the number of server roundtrips. EdgeDB has a unified interface
for retrieving structured data with implicit joins, compositional queries,
and structured return results, meaning that often only one request/response
event is needed. This differs from ORMs (Object-Relational
Mappers) that are unable to do this and `suffer performance-wise as a
result <https://www.edgedb.com/blog/why-orms-are-slow-and-getting-slower>`_.
A quote from Yury (EdgeDB co-founder and CEO) sums up the situation as follows:

.. pull-quote::

   Query languages are essential for retrieving data from databases. In
   relational databases, data is represented as relations, with SQL
   serving as the query language that retrieves data as rows from a
   table. However, in modern programming languages, data is often
   presented as a graph of object data. Writing SQL queries to directly
   consume or return graphs of objects can be difficult or even
   impossible, which is why developers often rely on ORM libraries
   to handle communication with the database. Nevertheless, this approach
   often leads to multiple suboptimal SQL queries for a single logical
   data operation, resulting in poor quality of service. Additionally,
   ORM APIs are typically not composable, forcing users to resort to
   SQL for any non-trivial operation.

So in the same way that Rust's zero-cost abstractions and (often)
functional coding style do not result in a degradation of performance,
the same is true with EdgeDB and its EdgeQL query language.

As summed up by Scott Trinh, a senior software engineer at EdgeDB:

.. pull-quote::

   The speed/performance advantage of EdgeDB is that it compiles to
   PostgreSQL statements that you would *never* write. […] It has only a
   slight overhead on executing the generated SQL directly, but the key
   is that the SQL it executes is nothing like what you use in the
   normal SQL world and very far from what an ORM would generate.

Similarly, a chain of
``.into_iter().flatten().inspect().map().filter()`` in Rust is something
you could manually write on your own, but in practice never would.


Compiler messages
-----------------

Rust places paramount importance on type safety and correctness, but it's
the compiler messages that make the language learnable in the first place.
Rust generally understands what you are trying to do when your code doesn't
compile and is able to lead you in the right direction.

Imagine what a task it would have been to learn Rust without them! What if
the following slightly incorrect code…

.. code:: rust

   fn main() {
     let x: String = "I am a String!";
     println!("{x}");
   }

…only produced the following error?

::

   Compiling playground v0.0.1 (/playground)
   error: type error

Nobody would have put in the time to learn a language as fearsome as
Rust if this were the case.

Fortunately that is *not* the case, and Rust lets you know exactly where
the problem lies and how to fix it.

::

   error[E0308]: mismatched types
    --> src/main.rs:2:21
     |
   2 |     let x: String = "I am a String!";
     |            ------   ^^^^^^^^^^^^^^^^- help: try using
     |            |        | a conversion method: `.to_string()`
     |            |        |
     |            |        expected `String`, found `&str`
     |            expected due to this

   For more information about this error, try `rustc --explain E0308`.

These compiler messages impressed EdgeDB, which set out to do the same.
Having a strict type system in the first place makes this easier than
expected: after all, if a compiler knows what input is required, it can
tell the user what to do when it is incorrect! While EdgeDB's compiler
messages are still nowhere near as detailed as the high benchmark set by
Rust, they aim to be as helpful as possible and often hit the mark when
something is awry.

Take the following type for example:

.. code-block:: sdl

   type UserInfo {
     required name: str;
     account_no: int32;
     date_created: std::datetime;
     age: int16 {
       constraint max_value(130);
     }
   }

There are a lot of conditions that have to be fulfilled before EdgeDB will
accept a new ``UserInfo`` object, just in the same way that Rust won't let you
initialize a struct that doesn't match how you defined it.

By trying to insert an incorrect ``UserInfo`` object, we can get a peek into
EdgeDB's compiler messages. Let's try to insert one that…

…is missing a ``required`` property ``name``:

.. code-block:: edgeql-repl

   db> insert UserInfo {
   ...   account_no := 100,
   ...   date_created := <std::datetime>'2023-09-09T09:10:10+09:00',
   ...   age := 15
   ... };

   error: MissingRequiredError: missing value for required property 'name'
   of object type 'default::UserInfo'

…has a number too large for a 32-bit integer:

.. code-block:: edgeql-repl

   db> insert UserInfo {
   ...   name := 'name',
   ...   account_no := 999999999999,
   ...   date_created := <std::datetime>'2023-09-09T09:10:10+09:00',
   ...   age := 15
   ... };

   edgedb error: NumericOutOfRangeError: std::int32 out of range

…has an incorrect ``datetime``:

.. code-block:: edgeql-repl

   db> insert UserInfo {
   ...   name := 'name',
   ...   account_no := 99,
   ...   date_created := <std::datetime>'2023-09-09T09:10:10',
   ...   age := 15
   ... };

   edgedb error: InvalidValueError: invalid input syntax for type
   std::datetime: '2023-09-09T09:10:10'

     Hint: Please use ISO8601 format. Example: 2010-12-27T23:59:59-07:00.
     Alternatively "to_datetime" function provides custom formatting options.

…has an ``age`` that violates the constraint that we added:

.. code-block:: edgeql-repl

   db> insert UserInfo {
   ...   name := 'name',
   ...   account_no := 99,
   ...   date_created := <std::datetime>'2023-09-09T09:10:10+09:00',
   ...   age := 150
   ... };

   edgedb error: ConstraintViolationError:
   Maximum allowed value for age is 130.

…that has an age of the wrong type:

.. code-block:: edgeql-repl

   db> insert UserInfo {
   ...   name := 'name',
   ...   account_no := 99,
   ...   date_created := <std::datetime>'2023-09-09T09:10:10+09:00',
   ...   age := 'Much age'
   ... };

   edgedb error: InvalidPropertyTargetError: invalid target
   for property 'age' of object type 'default::UserInfo':
   'std::str' (expecting 'std::int16')

…that is missing a comma in the insert query:

.. code-block:: edgeql-repl

   db> insert UserInfo {
   ...   name := 'Name'
   ...   account_no := 100,
   ...   date_created := <std::datetime>'2023-09-09T09:10:10+09:00',
   ...   age := 15
   ... };

   error: EdgeQLSyntaxError: Unexpected token: <Token IDENT "account_no">
     ┌─ <query>:3:1
     │
   3 │ account_no := 100,
     │ ^^^^^^^^^^ It appears that a ',' is missing in
     | a shape before 'account_no'

Rust's compiler messages improve as time goes on, and so do those in EdgeDB. If
you find one that needs work, please `let us know`_!

.. lint-off

.. _let us know: https://github.com/edgedb/edgedb/issues/new?assignees=&labels=&projects=&template=bug_report.md

.. lint-on


Everything is an expression
---------------------------

In Rust, just about everything is an expression. In EdgeQL,
`everything is an expression, and everything is a
set <https://youtu.be/Z0D24lZttvg?t=698>`_, which means that you can
replace any value with an equivalent expression and vice versa. This
lets you write your queries like you write code and makes it fairly
easy to imagine the equivalent Rust code to what you write using EdgeQL.

Take this example of an EdgeQL query that modifies a set of values line
by line, using an expression at each point until the end when ``select``
is used to display the query result.

.. code-block:: edgeql

   with
     nums := {8, 9, 10},
     added := nums * 2,
     filtered := (select added filter added > 16),
     enumerated := enumerate(filtered),
   select enumerated;

This is pretty similar to Rust, except that using an operator on a set
does the operation for *each member* of the set and passes on the output.
It's sort of like having an implicit ``.map()`` every time.

The most literal equivalent of this in Rust is using iterator methods
one line at a time instead of chaining them all together:

.. code:: rust

   let nums = [8, 9, 10].into_iter();
   let added = nums.map(|num| num * 2);
   let filtered = added.filter(|num| *num > 16);
   let enumerated = filtered.enumerate();
   println!("{enumerated:?}");

The next example ends up being even more similar to the equivalent Rust
code, as in this case we aren't dealing with chained iterator methods.
As you can see, every item inside a ``with`` statement is similar to a
variable created by a let binding.

.. code-block:: edgeql

   with
     movie_actor_names := {"Robert Downey Jr.", "Chris Evans"},
     actors := (select Person filter .name in movie_actor_names),
     avengers := (insert Movie { title := "Avengers", actors := actors }),
     endgame := (insert Movie { title := "Avengers: Endgame", actors := actors }),
     account := (select Account filter .login = "some_login_name")
   update
     account
   set {
       watch_list += {avengers, endgame}
   }

The rough Rust equivalent of the code above might look something like
this:

.. code:: rust

   // Start by getting all Person and Account results
   // to simulate a database lookup
   let people: Vec<Person> = client.some_method()?;
   let mut accounts: Vec<Account> = client.some_method();

   let movie_actor_names = ["Robert Downey Jr.", "Chris Evans"];
   let actors = people
     .iter()
     .filter(|person| movie_actor_names.contains(&person.name))
     .collect::<Vec<_>>();
   let avengers: Movie = client.insert_and_return(Movie {
     title: "Avengers",
     actors,
   })?;
   let endgame: Movie = client.insert_and_return(Movie {
     title: "Endgame",
     actors,
   })?;
   if let Some(account) = accounts
     .iter_mut()
     .find(|account| account.name == "some_login_name") {
       account.watch_list.push(avengers);
       account.watch_list.push(endgame);
     }

Hopefully this wasn't too much of a flood of information, but it truly
is interesting to compare EdgeDB and Rust to see the places where they
match up and where they almost do.

If your curiosity has been piqued, give the `EdgeDB interactive
tutorial <https://www.edgedb.com/tutorial>`_ a try to see how it feels.
For a more in-depth look you can install EdgeDB itself and begin working
through the `Easy EdgeDB <https://www.edgedb.com/easy-edgedb>`_ book
mentioned above, which teaches you EdgeDB and the EdgeQL query language
over 20 chapters as you put together the schema for an imaginary game
based on the setting of Bram Stoker's Dracula.

Oh, and `do drop by <https://www.edgedb.com/launch>`_ on November 1st to see
the launch of EdgeDB 4.0 and EdgeDB Cloud. Hope to see you there!

But wait, there's more!

If you feel like reading onward, the next section contains some tips and tricks
for Rust developers using EdgeDB so that you can implement the same patterns
you are used to with as near an EdgeDB equivalent as possible. It's sort of a
cheat sheet for Rust developers giving EdgeDB a try for the first time.


Some tips and tricks for the Rust developer using EdgeDB
--------------------------------------------------------

Creating and constraining your own types
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The usual way to make a new type in Rust is to wrap it in a struct
that doesn't expose the inner type and implement ``TryFrom``, or any other
method that returns a Result. A type that represents a human age might
look like this:

.. code:: rust

   struct HumanAge(i32);

   impl TryFrom<i32> for HumanAge {
     type Error = &'static str;

     fn try_from(num: i32) -> Result<Self, Self::Error> {
       // return Ok or Err depending on value of num...
     }
   }

This process is quicker in EdgeDB, though note that the end result is
simply a scalar type:

.. code-block:: sdl

   scalar type HumanAge extending int32 {
     constraint max_value(130);
     constraint min_value(0);
   }

You can think of it as similar to a Rust struct that holds a primitive
value, always implements ``TryFrom``, and gives direct access to the
internal value via ``.0`` instead of using ``Deref``.

So if you had these two types:

.. code-block:: sdl

   scalar type HumanAge extending int32 {
     constraint min_value(0);
     constraint max_value(130);
   }

   scalar type VampireAge extending int32 {
     constraint min_value(0);
   }

A ``HumanAge`` could only be constructed with values between 0 and 130,
while a ``VampireAge`` could be constructed with a minimum value of 0. But
when using them in practice it is as if you were always using ``.0`` to get
to the internal ``i32`` and thus the two can be used together.

Here is a quick schema to demonstrate:

.. code-block:: sdl

   scalar type HumanAge extending int32 {
     constraint min_value(0);
     constraint max_value(130);
   }

   scalar type VampireAge extending int32 {
     constraint min_value(0);
   }

   type Human {
     age: HumanAge
   }

   type Vampire {
     age: VampireAge
   }

And now two inserts.

This one won't work because ``age`` is greater than 130:

.. code-block:: edgeql-repl

   db> insert Human { age := 200 };
   edgedb error: ConstraintViolationError: Maximum allowed value
   for HumanAge is 130.

   Detail: Maximum allowed value for `scalar type
   'default`::`HumanAge'` is 130.

But this will:

.. code-block:: edgeql-repl

   db> insert Human { age := 100 };
   {default::Human {id: f640303a-52d5-11ee-9119-5fac8049810d}}

Won't work because age is negative:

.. code-block:: edgeql-repl

   db> insert Vampire { age := -100 };
   edgedb error: ConstraintViolationError: Minimum allowed
   value for VampireAge is 0.

   Detail: Minimum allowed value for `scalar type
   'default`::`VampireAge'` is 0.

But this will:

.. code-block:: edgeql-repl

   db> insert Vampire { age := 200 };
   {default::Vampire {id: fc5d3a1c-52d5-11ee-9119-cb6eeadc3909}}

And now that the objects are inserted, it is as if you are using .0 each
time to access the inner ``i32`` value. So this query that uses them in the
same set will work:

.. code-block:: edgeql-repl

   db> select {Human.age, Vampire.age};
   {100, 200}

You can think of the expression as producing a ``Vec<i32>``.


Object types (structs)
~~~~~~~~~~~~~~~~~~~~~~

EdgeDB object types are similar to structs in Rust, except that a parameter
inside an object type that leads to an object of another type is a ``link`` to
that object in Edgedb, while in Rust the data owned would be owned by the first
object.

.. code:: rust

   struct Country {
     cities: Vec<City>
   }

   // In EdgeDB:
   // type Country {
   //   required multi cities: City;
   // }

   struct City {
     name: String
   }

   // In EdgeDB:
   // type City {
   //   required name: str;
   // }

Did you notice the ``required`` keyword above in the EdgeDB examples? Values
are required in Rust by default, while you can use an ``Option`` to specify
that a value might or might not exist. EdgeDB allows the same but assumes an
optional value by default, with the ``required`` keyword making a value
obligatory.

The ``required`` and ``multi`` keywords work together to create the
following Rust equivalents:

======================= =====================
EdgeDB                  Rust
======================= =====================
``required City``       ``City``
``City``                ``Option<City>``
``required multi City`` ``Vec<City>``
``multi City``          ``Option<Vec<City>>``
======================= =====================

Despite minor differences, the concepts translate pretty cleanly, including the
way required values are treated. You can't just remove a parameter from a
struct in Rust:

.. code:: rust

   struct User {
       config: Config
   }

   struct Config {
       account_no: i32
   }

   fn main() {
       let mut user = User {
           config: Config {
               account_no: 555
           }
       };
       // Can't just remove config
   }

Similarly, EdgeDB won't let a required link be removed:

.. code-block:: edgeql-repl

   db> insert User {
   ...   config := (insert Config {
   ...   account_no := 555
   ...   })
   ... };
   {default::User {id: e3fd0d5e-4d93-11ee-9240-c31a2ae1fdb1}}

   db> update User set { config := {}};
   edgedb error: MissingRequiredError: missing value for required link
   'config' of object type 'default::User'


Tuples
~~~~~~

EdgeDB tuples are similar to Rust tuples in usage, but they can contain only
scalar (primitive) types and can have named elements.

.. code-block:: edgeql-repl

   db> with my_tuple := ("My name", 10),
   ... select my_tuple.0;
   {'My name'}

   db> with my_tuple := (name := "My name", number := 10),
   ... select my_tuple.name;
   {'My name'}


Enums
~~~~~

EdgeDB has no single equivalent to Rust's algebraic data type enums yet, but
there are some similar types and patterns.

EdgeDB enums look like Rust enums that contain no data. So this Rust
enum:

.. code:: rust

   enum PlayerClass {
       Warrior,
       Wizard,
       Barbarian
   }

would be represented as the following in EdgeDB:

.. code-block:: sdl

   scalar type PlayerClass extending enum<Warrior, Wizard, Barbarian>;`

This EdgeDB enum's values can then be accessed with the dot operator:
``PlayerClass.Warrior``.

For Rust enums *with* data, the closest equivalent is the EdgeDB union type
operator using the ``|`` sign. This allows direct access to an object type as
opposed to a simple scalar:

.. code-block:: sdl

   type Wizard;
   type Warrior;
   type Barbarian;

   type PlayerCharacter {
     required pc_class: Wizard | Warrior | Barbarian
   }

Another way to make an EdgeDB property similar to a Rust enum is by using the
``one_of`` constraint:

.. code-block:: sdl

   type Character {
     required class: str {
       constraint one_of('Warrior', 'Wizard', 'Barbarian');
     }
   }


Functions
~~~~~~~~~

A lot of the functions in the EdgeDB standard library resemble those you will
be accustomed to using in Rust. Here is a small sample:

+-------------------+------------------+-----------------------+
| EdgeDB            | Rust             | Notes                 |
+===================+==================+=======================+
| ``len()``         | ``len()``        | EdgeDB: number of     |
|                   |                  | elements. Rust:       |
|                   |                  | number of bytes       |
+-------------------+------------------+-----------------------+
| ``contains()``    | ``contains()``   |                       |
+-------------------+------------------+-----------------------+
| ``find()``        | ``position()``   | ``find()`` in Rust    |
|                   |                  | returns an Option of  |
|                   |                  | the item itself,      |
|                   |                  | while ``position()``  |
|                   |                  | returns the index.    |
+-------------------+------------------+-----------------------+
| ``count()``       | ``count()``      |                       |
+-------------------+------------------+-----------------------+
| ``sum()``         | ``sum()``        |                       |
+-------------------+------------------+-----------------------+
| ``all()``         | ``all()``        |                       |
+-------------------+------------------+-----------------------+
| ``any()``         | ``any()``        |                       |
+-------------------+------------------+-----------------------+
| ``enumerate()``   | ``enumerate()``  |                       |
+-------------------+------------------+-----------------------+


Adding strict typing and expressiveness when you can't use Rust
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Let's end the tips and tricks section on a wistful note: unfortunately,
not every Rust user works as a full-time Rust developer. Often you will
have to work on a codebase in a language that is less than strict,
cursing the extra mental burden as you do so.

This can be mitigated somewhat by at least switching to a database that
provides type safety, constraints, no nulls, and high expressiveness.
Fortunately the argument to switch from one database to another is an easier
one to make than switching programming languages.

Imagine for a moment that you are a Rust developer working at a company with a
large JavaScript codebase and some sort of NoSQL database — no schema, maybe
six or seven data types, and that's about it. Your company uses *some* Rust,
but most of the existing code in your day-to-day is JavaScript. One day you
notice something odd in the function used to insert information on client
companies into the database:

.. code:: javascript

   var SomeClient = require('db').DBClient;
   var url = "//localhost:someportnumber/";

   var myobj = {
     name: "Company Inc",
     address: "Highway 37",
     date_founded: "2020-09-001",
     employees: // snip: lots of data here
   };

   SomeClient.connect(url, myobj, function(err, db) {
     if (err) throw err;
     var dbo = db.db("mydb");
     dbo.collection("customers").insert(myobj, function(err, res) {
       if (err) throw err;
       console.log("1 document inserted");
       db.close();
     });
   });

.. image:: images/twitching-smile.gif
    :alt: A cartoon girl with black hair wearing a pink bandana and a pink
          turtlenck sweater. She's smiling a huge smile, but her left eye is
          twitching.

Oops! Looks like ``date_founded`` property has an extra ``0`` in it, which
the existing database has been happily inserting all this time. All of the
existing inserts with ``date_founded`` have to be modified now.

You wistfully think about how such an error would have been caught at
compile time in Rust, where you likely would have used a ``NaiveDate``
from the ``chrono`` crate to ensure that the date was being properly
formatted:

.. code:: rust

   use chrono::NaiveDate;

   fn main() {
     // Err(ParseError(TooLong))
     println!("{:?}", NaiveDate::parse_from_str("2020-09-001", "%Y-%m-%d"));
     // Ok(2020-09-01)
     println!("{:?}", NaiveDate::parse_from_str("2020-09-01", "%Y-%m-%d"));
   }

Another oops: it turns out that the objects in the database were also
supposed to contain each company's registration number. But without a
strict schema, there was nothing preventing an insert from happening
without it. Also, registration codes in your country need to start with
the letter "B" and must be nine characters in length.

In addition, there is no relation between the company inserts being made
and the employee inserts being made. It would be nice to have a link
between the two.

Here again you are being armed with an argument at the next team meeting
to switch to the type safety of EdgeDB. Using EdgeDB would have allowed
putting together a schema which would have made the above insert impossible.

Note the following in the schema below:

-  A new type called ``RegistrationCode``, based on EdgeDB's scalar
   (primitive) ``str`` type but with constraints added.
-  The ``Company`` type's ``date_founded`` property is a
   ``cal::local_date``, requiring correct formatting to construct.
-  All parameters are ``required`` — you can't insert a ``Company`` or
   an ``Employee`` without them.
-  The ``Company`` type has a backlink called ``employees`` that is
   automatically computed from the link of all inserted ``Employee``
   objects to their ``Company``. The ``employees`` syntax is essentially
   saying “show me all the Employee objects that link to a ``Company``
   object through a property called ``company``”.

Putting all this together makes for a schema that is simple, powerful,
and readable:

.. code-block:: sdl

   module default {
     type Employee {
       required name: str;
       required company: Company;
     }

     type Company {
       required name: str;
       required address: str;
       required date_founded: cal::local_date;
       required registration_code: RegistrationCode;
       link employees := .<company[is Employee];
     }

     scalar type RegistrationCode extending str {
       constraint expression on (len(__subject__) = 9) {
         errmessage :=
           "Registration codes must be nine characters in length."
       }
       constraint expression on (__subject__[0] = "B") {
         errmessage :=
           "Registration codes must all start with the letter B."
       }
     }
   }

Then follow this with some experimentation in the EdgeDB REPL or UI
to make sure that the behavior is as expected. And it is! Let's try
some invalid inserts to demonstrate.

Missing one or more required properties:

.. code-block:: edgeql-repl

   db> insert Company;
   error: MissingRequiredError: missing value for required
   property 'address' of object type 'Company'

Badly formatted ``local_date``:

.. code-block:: edgeql-repl

   db> insert Company {
   ...   name := "Company Inc",
   ...   address := "Highway 37",
   ...   date_founded := <cal::local_date>'2020-09-009',
   ...   registration_code := 'ROHEGOGH'
   ... };
   edgedb error: InvalidValueError: invalid input syntax for
   type cal::local_date: '2020-09-009'

   Hint: Please use ISO8601 format. Example: 2010-04-18
   Alternatively "to_local_date" function provides custom formatting options.

A ``RegistrationCode`` not nine characters in length, as per our constraint:

.. code-block:: edgeql-repl

   db> insert Company {
   ...   name := "Company Inc",
   ...   address := "Highway 37",
   ...   date_founded := <cal::local_date>'2020-09-09',
   ...   registration_code := 'ROHEGOGH'
   ... };

   edgedb error: ConstraintViolationError: Registration codes
   must be nine characters in length.

A ``RegistrationCode`` that doesn't start with B, as per our other
constraint:

.. code-block:: edgeql-repl

   db> insert Company {
   ...   name := "Company Inc",
   ...   address := "Highway 37",
   ...   date_founded := <cal::local_date>'2020-09-09',
   ...   registration_code := 'ROHEGOGHH'
   ... };
   edgedb error: ConstraintViolationError: Registration codes must all
   start with the letter B.

And finally a successful insert!

.. code-block:: edgeql-repl

   db> insert Company {
   ...   name := "Company Inc",
   ...   address := "Highway 37",
   ...   date_founded := <cal::local_date>'2020-09-09',
   ...   registration_code := 'BOHEGOGHH'
   ...  };

   {Company {id: ebff14b6-511c-11ee-91c7-07d85c873fe6}}

And the constraints don't end here either. You'd probably want to add a
``constraint exclusive`` to the ``registration_code`` for example to
ensure that no two companies will use the same code.

Finally, let's insert an ``Employee``.

.. code-block:: edgeql-repl

   db> insert Employee {
   ...   name := "Great Employee",
   ...   company := assert_single(
   ...     (select Company filter .name = "Company Inc"))
   ... };

Did you notice the ``assert_single`` part of the query? That's because
the link was not specified as ``multi``, making it a ``single`` link.
You could make it into a ``multi`` link to let employees work at
multiple locations (which probably makes sense), but in the meantime
EdgeDB is strictly complying with what we told it: always one company
per employee.

Once the insert is done, the backlink does its magic and the employees
will automatically show up in a query for the ``Company`` that shows all
properties and links. In EdgeDB this can be done with the so-called
double-splat operator.

.. code-block:: edgeql-repl

   db> select Company {**};
   {
     Company {
       id: ebff14b6-511c-11ee-91c7-07d85c873fe6,
       address: 'Highway 37',
       date_founded: <cal::local_date>'2020-09-09',
       name: 'Company Inc',
       registration_code: 'BOHEGOGHH',
       employees: {
         Employee {
            id: b7ae0a9a-511d-11ee-8d6a-274aec069009,
            name: 'Great Employee'
         }
       },
     },
   }


Next steps
----------

Hopefully this was enough to get you started as an EdgeDB-curious Rust
developer. If you have any questions, feel free to drop by our
`Discord server <https://discord.gg/edgedb>`_ where we and a few thousand
others are available to take questions and discuss the latest developments
with EdgeDB.
