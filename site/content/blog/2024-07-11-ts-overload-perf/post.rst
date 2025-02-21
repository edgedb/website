.. blog:authors:: scott
.. blog:published-on:: 2024-08-08 10:00 AM PT
.. blog:lead-image:: images/tsperf.jpg
.. blog:guid:: eadc2d8f-0c99-47bc-9650-11535202eb1a
.. blog:description:: A process for measuring and optimizing TypeScript type checking performance

==============================================================
An approach to optimizing TypeScript type checking performance
==============================================================

.. note::

  Check out the discussion of this post on
  `Hacker News <https://news.ycombinator.com/item?id=41226548>`_.

As developers, we spend much of our time thinking about the runtime performance of our code. Things like asymptotic runtime complexity, cache misses, and memory usage are all important factors to consider. However, one area of performance that can be difficult to optimize is TypeScript's type checking performance. This manifests as sluggish IDE responsiveness, extended compile times, or in extreme cases, TypeScript compiler crashes due to memory exhaustion.

When you run into one of these types of performance issues related to type-checking, it can be hard to how to start troubleshooting. Unlike runtime performance problems, we can't rely on our usual debugging approaches. The type checker operates within the TypeScript compiler during build time and the language server in your editor while editing, making it challenging to apply conventional debugging approaches.

While the `TypeScript team provides general guidance about type performance in their wiki <https://github.com/microsoft/TypeScript/wiki/Performance>`_, it can be daunting to determine how to effectively measure type checker performance and identify appropriate strategies to address any discovered issues.

We recently faced a similar challenge when TypeScript 5.3 introduced changes to the type inference algorithm, resulting in a significant performance regression. So much so, that certain parts of our test suite would cause the TypeScript compiler to run out of memory, and froze any attempt to use the language server. It was time to roll up our sleeves and come up with a plan for measuring and improving the type inference performance of this specific construct.

As we worked through this problem, we were struck by the scarcity of detailed information on effective workflows beyond the basic advice to use ``--extendedDiagnostics`` and ``--generateTrace``. This led us to explore the landscape of available tools and devise a strategy to leverage them effectively.

In this article, we'll walk you through the approach we used and share some workflow tips along the way. We'll use a simplified example, but keep in mind that our actual issue involved a more complex variation of the problem we'll discuss.

Before we dive in, I'd like to extend special thanks to:

- My colleague at EdgeDB, Aleksandra Sikora, for her extensive work on TypeScript performance measurement and analysis.
- David Blass for the excellent `arktype <https://arktype.io/>`_ library and ``attest`` testing framework, and for his invaluable feedback on this article.
- Larry Layland for his helpful suggestions during the review of this article.
- The TypeScript team, especially those involved in documentation, for their guidance.


Setting the stage
=================

The EdgeDB query builder introspects the database to determine the valid operators as defined by the database itself, which includes the valid operands for a given operator, and it's return type and cardinality. This information is used to create a set of overloads, 376 overloads in our initial implementation, for the ``e.op`` function, which is used to create expressions in the query builder.

For example:

.. code-block:: typescript

   e.select(e.User, (u) => ({
     accountAge: e.op(u.createdAt, "-", e.datetime_of_statement()),
   }));

In this example, the ``e.op`` function will find the overload that takes a ``datetime`` value as the first operand, the string ``"-"`` as the operator, and another ``datetime`` as the second operand. It will find such an overload, and the return type of the expression will have an element type of ``duration`` with a cardinality of ``One`` (assuming ``createdAt`` is a required property).

However, it should give us a type error if, for instance, you tried to have a ``str`` type as the second operand, or tried to provide an operator like ``ilike`` (which is only defined for ``str`` operands).

Our query builder works with expression-based data, similar to an abstract syntax tree (AST) - a tree representation of the structure of code. Instead of TypeScript primitives, we use objects representing expressions of those types. These expressions can be combined and nested, much like how elements in an AST relate to each other. For this example, we'll define ``$Number``, ``$String``, and ``$Boolean`` data types, along with operators that work with various combinations of these types. This approach allows us to model complex queries as composable expressions.

.. note::

   In the actual query builder's generated code, operands for scalar types are more complex. They can accept either literal scalars (such as ``"a"`` or ``true``) or expressions of that type (like ``e.select(someUser).name``). Due to this complexity, the approach we ultimately adopted is more sophisticated than the ones we'll explore in this post.

Let's take a look at one such operator, the ``=`` operator which should take operands of the same type, and return a ``$Boolean`` with a cardinality of ``One``.

Our initial approach was to define operators like this:

.. code-block:: typescript

   function op<Opr1 extends TypeSet<$String>, Opr2 extends TypeSet<$String>>(
     opr1: Opr1,
     op: "=",
     opr2: Opr2
   ): TypeSet<$Boolean, Cardinality.One>;
   function op<Opr1 extends TypeSet<$Number>, Opr2 extends TypeSet<$Number>>(
     opr1: Opr1,
     op: "=",
     opr2: Opr2
   ): TypeSet<$Boolean, Cardinality.One>;
   function op<Opr1 extends TypeSet<$Boolean>, Opr2 extends TypeSet<$Boolean>>(
     opr1: Opr1,
     op: "=",
     opr2: Opr2
   ): TypeSet<$Boolean, Cardinality.One>;

This naive approach works! It only defines overloads for valid operands and returns the correct expression type. It can even be nested since we have an overload defined for booleans:

.. code-block:: typescript

   import { $string, $number, $boolean } from "./typesystem.js";
   import { op } from "./operators.js";

   op($string("a"), "=", $string("b"));
   op($number(1), "=", $number(1));
   op(op($string("a"), "=", $string("a")), "=", $boolean(false));
   op($string("a"), "ilike", $string("Apex"));


The issue with this approach is that the type checker has to go through all of the overloads to find the right match, and as the number of overloads increases, the amount of work the type checker has to do starts to be impacted by how far down the list it has to go to find a matching overload.

Let's create a minimal TypeScript project to explore these concepts more directly. This project will include TypeScript configuration, several TypeScript modules, and a basic package.json file. We'll use this setup to define a bunch more operators and various combinations, giving us a better sense of the type checking performance in an almost-real-world scenario.

.. tabs::

  .. code-tab:: typescript
    :caption: index.ts

    import { $string, $number, $boolean } from "./typesystem.js";
    import { op } from "./operators.js";

    op($string("a"), "=", $string("b"));
    op($number(1), "=", $number(1));
    op(op($string("a"), "=", $string("a")), "=", $boolean(false));
    op($string("a"), "ilike", $string("Apex"));

  .. code-tab:: typescript
    :caption: operators.ts

    import type { $String, $Number, $Boolean, TypeSet } from "./typesystem.js";
    import { Cardinality } from "./typesystem.js";

    // String comparisons
    function op<
      Opr1 extends TypeSet<$String>,
      Opr2 extends TypeSet<$String>
    >(
      opr1: Opr1,
      op: "=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$String>,
      Opr2 extends TypeSet<$String>
    >(
      opr1: Opr1,
      op: "!=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$String>,
      Opr2 extends TypeSet<$String>
    >(
      opr1: Opr1,
      op: ">",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$String>,
      Opr2 extends TypeSet<$String>
    >(
      opr1: Opr1,
      op: "<",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$String>,
      Opr2 extends TypeSet<$String>
    >(
      opr1: Opr1,
      op: ">=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$String>,
      Opr2 extends TypeSet<$String>
    >(
      opr1: Opr1,
      op: "<=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$String>,
      Opr2 extends TypeSet<$String>
    >(
      opr1: Opr1,
      op: "?=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.AtMostOne>;

    function op<
      Opr1 extends TypeSet<$String>,
      Opr2 extends TypeSet<$String>
    >(
      opr1: Opr1,
      op: "?!=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.AtMostOne>;

    // Number comparisons
    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: "=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: "!=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: ">",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: "<",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: ">=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: "<=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: "?=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.AtMostOne>;

    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: "?!=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.AtMostOne>;

    // Boolean comparisons
    function op<
      Opr1 extends TypeSet<$Boolean>,
      Opr2 extends TypeSet<$Boolean>
    >(
      opr1: Opr1,
      op: "=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Boolean>,
      Opr2 extends TypeSet<$Boolean>
    >(
      opr1: Opr1,
      op: "!=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Boolean>,
      Opr2 extends TypeSet<$Boolean>
    >(
      opr1: Opr1,
      op: ">",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Boolean>,
      Opr2 extends TypeSet<$Boolean>
    >(
      opr1: Opr1,
      op: "<",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Boolean>,
      Opr2 extends TypeSet<$Boolean>
    >(
      opr1: Opr1,
      op: ">=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Boolean>,
      Opr2 extends TypeSet<$Boolean>
    >(
      opr1: Opr1,
      op: "<=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Boolean>,
      Opr2 extends TypeSet<$Boolean>
    >(
      opr1: Opr1,
      op: "?=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.AtMostOne>;

    function op<
      Opr1 extends TypeSet<$Boolean>,
      Opr2 extends TypeSet<$Boolean>
    >(
      opr1: Opr1,
      op: "?!=",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.AtMostOne>;

    // Boolean logical operations
    function op<
      Opr1 extends TypeSet<$Boolean>,
      Opr2 extends TypeSet<$Boolean>
    >(
      opr1: Opr1,
      op: "and",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Boolean>,
      Opr2 extends TypeSet<$Boolean>
    >(
      opr1: Opr1,
      op: "or",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    // Number arithmetic operations
    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: "+",
      opr2: Opr2
    ): TypeSet<$Number, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: "-",
      opr2: Opr2
    ): TypeSet<$Number, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: "*",
      opr2: Opr2
    ): TypeSet<$Number, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: "/",
      opr2: Opr2
    ): TypeSet<$Number, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: "%",
      opr2: Opr2
    ): TypeSet<$Number, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: "//",
      opr2: Opr2
    ): TypeSet<$Number, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$Number>,
      Opr2 extends TypeSet<$Number>
    >(
      opr1: Opr1,
      op: "^",
      opr2: Opr2
    ): TypeSet<$Number, Cardinality.One>;

    // Unary number operations
    function op<Opr extends TypeSet<$Number>>(
      op: "+",
      opr: Opr
    ): TypeSet<$Number, Cardinality.One>;

    function op<Opr extends TypeSet<$Number>>(
      op: "-",
      opr: Opr
    ): TypeSet<$Number, Cardinality.One>;

    // Unary boolean operation
    function op<Opr extends TypeSet<$Boolean>>(
      op: "not",
      opr: Opr
    ): TypeSet<$Boolean, Cardinality.One>;

    // String-specific operations
    function op<
      Opr1 extends TypeSet<$String>,
      Opr2 extends TypeSet<$String>
    >(
      opr1: Opr1,
      op: "ilike",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$String>,
      Opr2 extends TypeSet<$String>
    >(
      opr1: Opr1,
      op: "not ilike",
      opr2: Opr2
    ): TypeSet<$Boolean, Cardinality.One>;

    function op<
      Opr1 extends TypeSet<$String>,
      Opr2 extends TypeSet<$String>
    >(
      opr1: Opr1,
      op: "++",
      opr2: Opr2
    ): TypeSet<$String, Cardinality.One>;

    function op(...args: any[]) {
      return {} as any;
    }

    export { op };

  .. code-tab:: typescript
    :caption: typesystem.ts

    export enum Cardinality {
      AtMostOne = "AtMostOne",
      One = "One",
      Many = "Many",
      AtLeastOne = "AtLeastOne",
      Empty = "Empty",
    }

    export interface BaseType {
      __name__: string;
      __tstype__: string;
    }

    export interface $String extends BaseType {
      __name__: "$String";
      __tstype__: "string";
    }

    export function $string(val: string) {
      return {
        __element__: {
          __name__: "$String",
          __tstype__: "string",
        },
        __cardinality__: Cardinality.One,
        __value__: val,
      } as const;
    }

    export interface $Number extends BaseType {
      __name__: "$Number";
      __tstype__: "number";
    }

    export function $number(val: number) {
      return {
        __element__: {
          __name__: "$Number",
          __tstype__: "number",
        },
        __cardinality__: Cardinality.One,
        __value__: val,
      } as const;
    }

    export interface $Boolean extends BaseType {
      __name__: "$Boolean";
      __tstype__: "boolean";
    }

    export function $boolean(val: boolean) {
      return {
        __element__: {
          __name__: "$Boolean",
          __tstype__: "boolean",
        },
        __cardinality__: Cardinality.One,
        __value__: val,
      } as const;
    }

    export interface TypeSet<
      T extends BaseType = BaseType,
      Card extends Cardinality = Cardinality,
    > {
      __element__: T;
      __cardinality__: Card;
    }


  .. code-tab:: json
    :caption: package.json

    {
      "name": "tsperf-blog-post",
      "version": "1.0.0",
      "description": "",
      "main": "index.js",
      "type": "module",
      "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
      },
      "keywords": [],
      "author": "",
      "license": "ISC",
      "devDependencies": {
        "@ark/attest": "^0.11.0",
        "arktype": "^2.0.0-beta.3",
        "tsx": "^4.16.2",
        "typescript": "^5.5.3"
      }
    }


  .. code-tab:: json
    :caption: tsconfig.json

    {
      "compilerOptions": {
        "strict": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "strictFunctionTypes": true,
        "strictPropertyInitialization": true,
        "strictBindCallApply": true,
        "noImplicitThis": true,
        "noImplicitReturns": true,
        "alwaysStrict": true,
        "esModuleInterop": true,
        "declaration": true,
        "target": "ES2022",
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "skipLibCheck": true
      },
      "include": ["./*.ts"]
    }




How do we quantify the type checker's workload?
===============================================

The simplest way to measure type checker performance is to get diagnostics from the compiler. You can invoke the compiler with a flag that will output helpful metrics about the compilation process. For our use case there are a few metrics we're interested in, the total number of type instantiations, and to a lesser degree, the wall-time spent in the type checking step. You can get these diagnostics by running the TypeScript compiler with the ``--extendedDiagnostics`` flag.

The TypeScript type checker operates by analyzing the structure and relationships of types in your code. It performs type inference, checks for type compatibility, and ensures that operations are valid within the type system. During this process, the type checker often needs to create concrete instances of generic types, a process known as type instantiation. Each time a generic type is used with specific type arguments, a new type is instantiated. The number of type instantiations serves as a good proxy for the "amount of work" the type checker has to do because it directly correlates with the complexity of the type relationships in your code. More type instantiations generally indicate more complex type structures or a higher number of generic type usages, which require more processing time and memory from the type checker. By measuring the number of type instantiations, we can get a reliable, reproducible metric that reflects the workload on the type checker, independent of variations in hardware performance or other external factors.

Let's run these diagnostics now, with the ``--noEmit`` flag to avoid actually emitting JavaScript files since we only care about the type checking performance at the moment.

.. code-block:: bash

   $ npx tsc --noEmit --extendedDiagnostics
   Files:                         66
   Lines of Library:           39995
   Lines of Definitions:           0
   Lines of TypeScript:          268
   Lines of JavaScript:            0
   Lines of JSON:                  0
   Lines of Other:                 0
   Identifiers:                43933
   Symbols:                    29170
   Types:                        288
   Instantiations:               191
   Memory used:               57207K
   Assignability cache size:      33
   Identity cache size:            0
   Subtype cache size:            10
   Strict subtype cache size:      0
   I/O Read time:              0.01s
   Parse time:                 0.28s
   ResolveModule time:         0.00s
   ResolveLibrary time:        0.06s
   Program time:               0.39s
   Bind time:                  0.16s
   Check time:                 0.08s
   printTime time:             0.00s
   Emit time:                  0.00s
   Total time:                 0.63s


We see here that we are currently instantiating 191 types in the process of checking this project.

One drawback of using ``--extendedDiagnostics`` is that you do not get any real feedback about where to look to improve performance. The next tool we'll look at, ``--generateTrace``, gives you a more detailed breakdown of what is happening during the compilation process. It hooks into the type checker and provides a detailed report of what types are being instantiated, and how long it takes.

Let's take a look at what we see when using ``--generateTrace`` which takes the name of a directory as an argument. We'll use today's date and time to make it easy to compare these values across time.

.. code-block:: bash

  $ npx tsc --noEmit --generateTrace 20240715T1634
  $ ls 20240715T1634
  trace.json  types.json


The TypeScript compiler will generate two files: ``trace.json`` and ``types.json``. Loading ``trace.json`` into a trace viewer like `Perfetto <https://ui.perfetto.dev>`__, we can now see what was happening when compiling our code.

The trace can give us some details about which expressions take the most time to check, but since it reports wall-time, it's not a stable base to build our benchmark against. We'll need to run this trace multiple times to get a good baseline. Luckily, our next tool gives us just such a stable measurement that is a good proxy for type-checker performance.

Marking the workbench
=====================

That tool is the fantastic ``@arktype/attest`` package which contains a really helpful benchmarking library that can measure type instantiations. Let's replace our main script with a benchmarking script that we can run using Node.

.. code-block:: typescript
  :class: collapsible

   import { bench } from "@ark/attest";
   import { $string, $number, $boolean } from "./typesystem.js";
   import { op } from "./operators.js";

   // Creating a baseline expression that does not appear in the benchmarked
   // code gives more accurate results
   bench.baseline(() => $string("baseline"));

   bench("string: =", () => {
     return op($string("a"), "=", $string("b"));
   }).types([1, "instantiations"]);

   bench("string: !=", () => {
     return op($string("a"), "!=", $string("b"));
   }).types([1, "instantiations"]);

   bench("string: >", () => {
     return op($string("a"), ">", $string("b"));
   }).types([1, "instantiations"]);

   bench("string: <", () => {
     return op($string("a"), "<", $string("b"));
   }).types([1, "instantiations"]);

   bench("string: >=", () => {
     return op($string("a"), ">=", $string("b"));
   }).types([1, "instantiations"]);

   bench("string: <=", () => {
     return op($string("a"), "<=", $string("b"));
   }).types([1, "instantiations"]);

   bench("string: ?=", () => {
     return op($string("a"), "?=", $string("b"));
   }).types([1, "instantiations"]);

   bench("string: ?!=", () => {
     return op($string("a"), "?!=", $string("b"));
   }).types([1, "instantiations"]);

   bench("string: ++", () => {
     return op($string("a"), "++", $string("b"));
   }).types([1, "instantiations"]);

   bench("number: =", () => {
     return op($number(1), "=", $number(1));
   }).types([1, "instantiations"]);

   bench("number: !=", () => {
     return op($number(1), "!=", $number(1));
   }).types([1, "instantiations"]);

   bench("number: >", () => {
     return op($number(1), ">", $number(1));
   }).types([1, "instantiations"]);

   bench("number: <", () => {
     return op($number(1), "<", $number(1));
   }).types([1, "instantiations"]);

   bench("number: >=", () => {
     return op($number(1), ">=", $number(1));
   }).types([1, "instantiations"]);

   bench("number: <=", () => {
     return op($number(1), "<=", $number(1));
   }).types([1, "instantiations"]);

   bench("number: ?=", () => {
     return op($number(1), "?=", $number(1));
   }).types([1, "instantiations"]);

   bench("number: ?!=", () => {
     return op($number(1), "?!=", $number(1));
   }).types([1, "instantiations"]);

   bench("number: +", () => {
     return op($number(1), "+", $number(1));
   }).types([1, "instantiations"]);

   bench("number: -", () => {
     return op($number(1), "-", $number(1));
   }).types([1, "instantiations"]);

   bench("number: *", () => {
     return op($number(1), "*", $number(1));
   }).types([1, "instantiations"]);

   bench("number: /", () => {
     return op($number(1), "/", $number(1));
   }).types([1, "instantiations"]);

   bench("number: %", () => {
     return op($number(1), "%", $number(1));
   }).types([1, "instantiations"]);

   bench("number: //", () => {
     return op($number(1), "//", $number(1));
   }).types([1, "instantiations"]);

   bench("number: ^", () => {
     return op($number(1), "^", $number(1));
   }).types([1, "instantiations"]);

   bench("number: unary +", () => {
     return op("+", $number(1));
   }).types([1, "instantiations"]);

   bench("number: unary -", () => {
     return op("-", $number(1));
   }).types([1, "instantiations"]);

   bench("boolean: =", () => {
     return op($boolean(true), "=", $boolean(false));
   }).types([1, "instantiations"]);

   bench("boolean: !=", () => {
     return op($boolean(true), "!=", $boolean(false));
   }).types([1, "instantiations"]);

   bench("boolean: >", () => {
     return op($boolean(true), ">", $boolean(false));
   }).types([1, "instantiations"]);

   bench("boolean: <", () => {
     return op($boolean(true), "<", $boolean(false));
   }).types([1, "instantiations"]);

   bench("boolean: >=", () => {
     return op($boolean(true), ">=", $boolean(false));
   }).types([1, "instantiations"]);

   bench("boolean: <=", () => {
     return op($boolean(true), "<=", $boolean(false));
   }).types([1, "instantiations"]);

   bench("boolean: ?=", () => {
     return op($boolean(true), "?=", $boolean(false));
   }).types([1, "instantiations"]);

   bench("boolean: ?!=", () => {
     return op($boolean(true), "?!=", $boolean(false));
   }).types([1, "instantiations"]);

   bench("boolean: and", () => {
     return op($boolean(true), "and", $boolean(false));
   }).types([1, "instantiations"]);

   bench("boolean: or", () => {
     return op($boolean(true), "or", $boolean(false));
   }).types([1, "instantiations"]);

   bench("boolean: not", () => {
     return op("not", $boolean(true));
   }).types([1, "instantiations"]);

   bench("nested boolean: =", () => {
     return op(op($string("a"), "=", $string("a")), "=", $boolean(false));
   }).types([1, "instantiations"]);

   bench("string: ilike", () => {
     return op($string("a"), "ilike", $string("apex"));
   }).types([1, "instantiations"]);

   bench("string: not ilike", () => {
     return op($string("a"), "not ilike", $string("apex"));
   }).types([1, "instantiations"]);



Running this benchmark with ``tsx`` will give us the following output:

.. code-block:: bash
  :class: collapsible

   $ npx tsx bench.ts
   🏌️  string: =
   ⛳ Result: 8 instantiations
   🎯 Baseline: 1 instantiations
   📈 'string: =' exceeded baseline by 700.00% (threshold is 20%).

   🏌️  string: !=
   ⛳ Result: 12 instantiations
   🎯 Baseline: 1 instantiations
   📈 'string: !=' exceeded baseline by 1100.00% (threshold is 20%).

   🏌️  string: >
   ⛳ Result: 16 instantiations
   🎯 Baseline: 1 instantiations
   📈 'string: >' exceeded baseline by 1500.00% (threshold is 20%).

   🏌️  string: <
   ⛳ Result: 20 instantiations
   🎯 Baseline: 1 instantiations
   📈 'string: <' exceeded baseline by 1900.00% (threshold is 20%).

   🏌️  string: >=
   ⛳ Result: 24 instantiations
   🎯 Baseline: 1 instantiations
   📈 'string: >=' exceeded baseline by 2300.00% (threshold is 20%).

   🏌️  string: <=
   ⛳ Result: 28 instantiations
   🎯 Baseline: 1 instantiations
   📈 'string: <=' exceeded baseline by 2700.00% (threshold is 20%).

   🏌️  string: ?=
   ⛳ Result: 32 instantiations
   🎯 Baseline: 1 instantiations
   📈 'string: ?=' exceeded baseline by 3100.00% (threshold is 20%).

   🏌️  string: ?!=
   ⛳ Result: 36 instantiations
   🎯 Baseline: 1 instantiations
   📈 'string: ?!=' exceeded baseline by 3500.00% (threshold is 20%).

   🏌️  string: ++
   ⛳ Result: 93 instantiations
   🎯 Baseline: 1 instantiations
   📈 'string: ++' exceeded baseline by 9200.00% (threshold is 20%).

   🏌️  number: =
   ⛳ Result: 17 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: =' exceeded baseline by 1600.00% (threshold is 20%).

   🏌️  number: !=
   ⛳ Result: 21 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: !=' exceeded baseline by 2000.00% (threshold is 20%).

   🏌️  number: >
   ⛳ Result: 25 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: >' exceeded baseline by 2400.00% (threshold is 20%).

   🏌️  number: <
   ⛳ Result: 29 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: <' exceeded baseline by 2800.00% (threshold is 20%).

   🏌️  number: >=
   ⛳ Result: 33 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: >=' exceeded baseline by 3200.00% (threshold is 20%).

   🏌️  number: <=
   ⛳ Result: 37 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: <=' exceeded baseline by 3600.00% (threshold is 20%).

   🏌️  number: ?=
   ⛳ Result: 41 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: ?=' exceeded baseline by 4000.00% (threshold is 20%).

   🏌️  number: ?!=
   ⛳ Result: 45 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: ?!=' exceeded baseline by 4400.00% (threshold is 20%).

   🏌️  number: +
   ⛳ Result: 71 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: +' exceeded baseline by 7000.00% (threshold is 20%).

   🏌️  number: -
   ⛳ Result: 75 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: -' exceeded baseline by 7400.00% (threshold is 20%).

   🏌️  number: *
   ⛳ Result: 79 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: *' exceeded baseline by 7800.00% (threshold is 20%).

   🏌️  number: /
   ⛳ Result: 83 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: /' exceeded baseline by 8200.00% (threshold is 20%).

   🏌️  number: %
   ⛳ Result: 87 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: %' exceeded baseline by 8600.00% (threshold is 20%).

   🏌️  number: //
   ⛳ Result: 91 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: //' exceeded baseline by 9000.00% (threshold is 20%).

   🏌️  number: ^
   ⛳ Result: 95 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: ^' exceeded baseline by 9400.00% (threshold is 20%).

   🏌️  number: unary +
   ⛳ Result: 5 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: unary +' exceeded baseline by 400.00% (threshold is 20%).

   🏌️  number: unary -
   ⛳ Result: 6 instantiations
   🎯 Baseline: 1 instantiations
   📈 'number: unary -' exceeded baseline by 500.00% (threshold is 20%).

   🏌️  boolean: =
   ⛳ Result: 20 instantiations
   🎯 Baseline: 1 instantiations
   📈 'boolean: =' exceeded baseline by 1900.00% (threshold is 20%).

   🏌️  boolean: !=
   ⛳ Result: 25 instantiations
   🎯 Baseline: 1 instantiations
   📈 'boolean: !=' exceeded baseline by 2400.00% (threshold is 20%).

   🏌️  boolean: >
   ⛳ Result: 29 instantiations
   🎯 Baseline: 1 instantiations
   📈 'boolean: >' exceeded baseline by 2800.00% (threshold is 20%).

   🏌️  boolean: <
   ⛳ Result: 33 instantiations
   🎯 Baseline: 1 instantiations
   📈 'boolean: <' exceeded baseline by 3200.00% (threshold is 20%).

   🏌️  boolean: >=
   ⛳ Result: 37 instantiations
   🎯 Baseline: 1 instantiations
   📈 'boolean: >=' exceeded baseline by 3600.00% (threshold is 20%).

   🏌️  boolean: <=
   ⛳ Result: 41 instantiations
   🎯 Baseline: 1 instantiations
   📈 'boolean: <=' exceeded baseline by 4000.00% (threshold is 20%).

   🏌️  boolean: ?=
   ⛳ Result: 45 instantiations
   🎯 Baseline: 1 instantiations
   📈 'boolean: ?=' exceeded baseline by 4400.00% (threshold is 20%).

   🏌️  boolean: ?!=
   ⛳ Result: 49 instantiations
   🎯 Baseline: 1 instantiations
   📈 'boolean: ?!=' exceeded baseline by 4800.00% (threshold is 20%).

   🏌️  boolean: and
   ⛳ Result: 53 instantiations
   🎯 Baseline: 1 instantiations
   📈 'boolean: and' exceeded baseline by 5200.00% (threshold is 20%).

   🏌️  boolean: or
   ⛳ Result: 57 instantiations
   🎯 Baseline: 1 instantiations
   📈 'boolean: or' exceeded baseline by 5600.00% (threshold is 20%).

   🏌️  boolean: not
   ⛳ Result: 3 instantiations
   🎯 Baseline: 1 instantiations
   📈 'boolean: not' exceeded baseline by 200.00% (threshold is 20%).

   🏌️  nested boolean: =
   ⛳ Result: 28 instantiations
   🎯 Baseline: 1 instantiations
   📈 'nested boolean: =' exceeded baseline by 2700.00% (threshold is 20%).

   🏌️  string: ilike
   ⛳ Result: 85 instantiations
   🎯 Baseline: 1 instantiations
   📈 'string: ilike' exceeded baseline by 8400.00% (threshold is 20%).

   🏌️  string: not ilike
   ⛳ Result: 89 instantiations
   🎯 Baseline: 1 instantiations
   📈 'string: not ilike' exceeded baseline by 8800.00% (threshold is 20%).

   ❌ 'string: =' exceeded baseline by 700.00% (threshold is 20%).
   ❌ 'string: !=' exceeded baseline by 1100.00% (threshold is 20%).
   ❌ 'string: >' exceeded baseline by 1500.00% (threshold is 20%).
   ❌ 'string: <' exceeded baseline by 1900.00% (threshold is 20%).
   ❌ 'string: >=' exceeded baseline by 2300.00% (threshold is 20%).
   ❌ 'string: <=' exceeded baseline by 2700.00% (threshold is 20%).
   ❌ 'string: ?=' exceeded baseline by 3100.00% (threshold is 20%).
   ❌ 'string: ?!=' exceeded baseline by 3500.00% (threshold is 20%).
   ❌ 'string: ++' exceeded baseline by 9200.00% (threshold is 20%).
   ❌ 'number: =' exceeded baseline by 1600.00% (threshold is 20%).
   ❌ 'number: !=' exceeded baseline by 2000.00% (threshold is 20%).
   ❌ 'number: >' exceeded baseline by 2400.00% (threshold is 20%).
   ❌ 'number: <' exceeded baseline by 2800.00% (threshold is 20%).
   ❌ 'number: >=' exceeded baseline by 3200.00% (threshold is 20%).
   ❌ 'number: <=' exceeded baseline by 3600.00% (threshold is 20%).
   ❌ 'number: ?=' exceeded baseline by 4000.00% (threshold is 20%).
   ❌ 'number: ?!=' exceeded baseline by 4400.00% (threshold is 20%).
   ❌ 'number: +' exceeded baseline by 7000.00% (threshold is 20%).
   ❌ 'number: -' exceeded baseline by 7400.00% (threshold is 20%).
   ❌ 'number: *' exceeded baseline by 7800.00% (threshold is 20%).
   ❌ 'number: /' exceeded baseline by 8200.00% (threshold is 20%).
   ❌ 'number: %' exceeded baseline by 8600.00% (threshold is 20%).
   ❌ 'number: //' exceeded baseline by 9000.00% (threshold is 20%).
   ❌ 'number: ^' exceeded baseline by 9400.00% (threshold is 20%).
   ❌ 'number: unary +' exceeded baseline by 400.00% (threshold is 20%).
   ❌ 'number: unary -' exceeded baseline by 500.00% (threshold is 20%).
   ❌ 'boolean: =' exceeded baseline by 1900.00% (threshold is 20%).
   ❌ 'boolean: !=' exceeded baseline by 2400.00% (threshold is 20%).
   ❌ 'boolean: >' exceeded baseline by 2800.00% (threshold is 20%).
   ❌ 'boolean: <' exceeded baseline by 3200.00% (threshold is 20%).
   ❌ 'boolean: >=' exceeded baseline by 3600.00% (threshold is 20%).
   ❌ 'boolean: <=' exceeded baseline by 4000.00% (threshold is 20%).
   ❌ 'boolean: ?=' exceeded baseline by 4400.00% (threshold is 20%).
   ❌ 'boolean: ?!=' exceeded baseline by 4800.00% (threshold is 20%).
   ❌ 'boolean: and' exceeded baseline by 5200.00% (threshold is 20%).
   ❌ 'boolean: or' exceeded baseline by 5600.00% (threshold is 20%).
   ❌ 'boolean: not' exceeded baseline by 200.00% (threshold is 20%).
   ❌ 'nested boolean: =' exceeded baseline by 2700.00% (threshold is 20%).
   ❌ 'string: ilike' exceeded baseline by 8400.00% (threshold is 20%).
   ❌ 'string: not ilike' exceeded baseline by 8800.00% (threshold is 20%).


The ``@arktype/attest`` output provides a detailed breakdown of type instantiations for each expression, comparing them to our initial placeholder baseline. We'll use these results as our actual baseline, updating our benchmark script with the real instantiation counts.

The BAM Method
==============

To address TypeScript type inference performance issues, I propose the "BAM" method: Branch, Adjust, Measure. This iterative approach involves:

1. **Branch**: Create a new branch for each experiment
2. **Adjust**: Make changes based on a hypothesis
3. **Measure**: Benchmark the changes to measure their impact

By systematically applying this process, we can refine our code for better type inference performance. Crucially, the benchmarking step provides concrete measurements, ensuring we can verify our improvements.

First, we'll *branch* to create a new experimental version of our code. Let's assume that we're working on a branch called ``1234-some-perf-work``. We will name this new experimental branch ``1234-experiments/union-operators``.

Our hypothesis is that defining a union to describe the various operators for a given operand-pair might be faster for the type checker to infer. This approach could potentially reduce the number of overloads the type checker needs to consider, as it groups similar operations together. By consolidating the operator types into a union, we might simplify the type inference process, potentially leading to fewer type instantiations and improved performance.

Then, we'll *adjust* our implementation based on this hypothesis. After making these adjustments, we'll *measure* the impact using our benchmarking tools to verify if our hypothesis leads to improved performance.

Branch:

.. code-block:: bash

   $ git checkout -b 1234-experiments/union-operators 1234-some-perf-work

Adjust:

.. code-block:: typescript
  :class: collapsible

   function op<Opr1 extends TypeSet<$String>, Opr2 extends TypeSet<$String>>(
     opr1: Opr1,
     op: "=" | "!=" | ">" | "<" | ">=" | "<=" | "ilike" | "not ilike",
     opr2: Opr2,
   ): TypeSet<$Boolean, Cardinality.One>;
   function op<Opr1 extends TypeSet<$String>, Opr2 extends TypeSet<$String>>(
     opr1: Opr1,
     op: "?=" | "!?=",
     opr2: Opr2,
   ): TypeSet<$Boolean, Cardinality.AtMostOne>;

   function op<Opr1 extends TypeSet<$Number>, Opr2 extends TypeSet<$Number>>(
     opr1: Opr1,
     op: "=" | "!=" | ">" | "<" | ">=" | "<=",
     opr2: Opr2,
   ): TypeSet<$Boolean, Cardinality.One>;
   function op<Opr1 extends TypeSet<$Number>, Opr2 extends TypeSet<$Number>>(
     opr1: Opr1,
     op: "?=" | "!?=",
     opr2: Opr2,
   ): TypeSet<$Boolean, Cardinality.AtMostOne>;

   function op<Opr1 extends TypeSet<$Boolean>, Opr2 extends TypeSet<$Boolean>>(
     opr1: Opr1,
     op: "=" | "!=" | ">" | "<" | ">=" | "<=" | "and" | "or",
     opr2: Opr2,
   ): TypeSet<$Boolean, Cardinality.One>;
   function op<Opr1 extends TypeSet<$Boolean>, Opr2 extends TypeSet<$Boolean>>(
     opr1: Opr1,
     op: "?=" | "!?=",
     opr2: Opr2,
   ): TypeSet<$Boolean, Cardinality.AtMostOne>;

   function op<Opr1 extends TypeSet<$Number>, Opr2 extends TypeSet<$Number>>(
     opr1: Opr1,
     op: "+" | "-" | "*" | "/" | "%" | "//" | "^",
     opr2: Opr2,
   ): TypeSet<$Number, Cardinality.One>;

   function op<Opr extends TypeSet<$Number>>(
     op: "+" | "-",
     opr: Opr,
   ): TypeSet<$Number, Cardinality.One>;

   function op<Opr extends TypeSet<$Boolean>>(
     op: "not",
     opr: Opr,
   ): TypeSet<$Boolean, Cardinality.One>;

   function op<Opr1 extends TypeSet<$String>, Opr2 extends TypeSet<$String>>(
     opr1: Opr1,
     op: "++",
     opr2: Opr2,
   ): TypeSet<$String, Cardinality.One>;

Benchmark:

.. code-block:: bash
  :class: collapsible

   $ npx tsx bench.ts
   🏌️  string: =
   ⛳ Result: 12 instantiations
   🎯 Baseline: 8 instantiations
   📈 'string: =' exceeded baseline by 50.00% (threshold is 20%).

   🏌️  string: !=
   ⛳ Result: 12 instantiations
   🎯 Baseline: 12 instantiations
   📊 Delta: 0.00%

   🏌️  string: >
   ⛳ Result: 12 instantiations
   🎯 Baseline: 16 instantiations
   📉 string: > was under baseline by 25.00%! Consider setting a new baseline.

   🏌️  string: <
   ⛳ Result: 12 instantiations
   🎯 Baseline: 20 instantiations
   📉 string: < was under baseline by 40.00%! Consider setting a new baseline.

   🏌️  string: >=
   ⛳ Result: 12 instantiations
   🎯 Baseline: 24 instantiations
   📉 string: >= was under baseline by 50.00%! Consider setting a new baseline.

   🏌️  string: <=
   ⛳ Result: 12 instantiations
   🎯 Baseline: 28 instantiations
   📉 string: <= was under baseline by 57.14%! Consider setting a new baseline.

   🏌️  string: ?=
   ⛳ Result: 16 instantiations
   🎯 Baseline: 32 instantiations
   📉 string: ?= was under baseline by 50.00%! Consider setting a new baseline.

   🏌️  string: ?!=
   ⛳ Result: 16 instantiations
   🎯 Baseline: 36 instantiations
   📉 string: ?!= was under baseline by 55.56%! Consider setting a new baseline.

   🏌️  string: ++
   ⛳ Result: 8 instantiations
   🎯 Baseline: 102 instantiations
   📉 string: ++ was under baseline by 92.16%! Consider setting a new baseline.

   🏌️  number: =
   ⛳ Result: 16 instantiations
   🎯 Baseline: 26 instantiations
   📉 number: = was under baseline by 38.46%! Consider setting a new baseline.

   🏌️  number: !=
   ⛳ Result: 16 instantiations
   🎯 Baseline: 30 instantiations
   📉 number: != was under baseline by 46.67%! Consider setting a new baseline.

   🏌️  number: >
   ⛳ Result: 16 instantiations
   🎯 Baseline: 34 instantiations
   📉 number: > was under baseline by 52.94%! Consider setting a new baseline.

   🏌️  number: <
   ⛳ Result: 16 instantiations
   🎯 Baseline: 38 instantiations
   📉 number: < was under baseline by 57.89%! Consider setting a new baseline.

   🏌️  number: >=
   ⛳ Result: 16 instantiations
   🎯 Baseline: 42 instantiations
   📉 number: >= was under baseline by 61.90%! Consider setting a new baseline.

   🏌️  number: <=
   ⛳ Result: 16 instantiations
   🎯 Baseline: 46 instantiations
   📉 number: <= was under baseline by 65.22%! Consider setting a new baseline.

   🏌️  number: ?=
   ⛳ Result: 20 instantiations
   🎯 Baseline: 50 instantiations
   📉 number: ?= was under baseline by 60.00%! Consider setting a new baseline.

   🏌️  number: ?!=
   ⛳ Result: 20 instantiations
   🎯 Baseline: 54 instantiations
   📉 number: ?!= was under baseline by 62.96%! Consider setting a new baseline.

   🏌️  number: +
   ⛳ Result: 30 instantiations
   🎯 Baseline: 80 instantiations
   📉 number: + was under baseline by 62.50%! Consider setting a new baseline.

   🏌️  number: -
   ⛳ Result: 30 instantiations
   🎯 Baseline: 84 instantiations
   📉 number: - was under baseline by 64.29%! Consider setting a new baseline.

   🏌️  number: *
   ⛳ Result: 30 instantiations
   🎯 Baseline: 88 instantiations
   📉 number: * was under baseline by 65.91%! Consider setting a new baseline.

   🏌️  number: /
   ⛳ Result: 30 instantiations
   🎯 Baseline: 92 instantiations
   📉 number: / was under baseline by 67.39%! Consider setting a new baseline.

   🏌️  number: %
   ⛳ Result: 30 instantiations
   🎯 Baseline: 96 instantiations
   📉 number: % was under baseline by 68.75%! Consider setting a new baseline.

   🏌️  number: //
   ⛳ Result: 30 instantiations
   🎯 Baseline: 100 instantiations
   📉 number: // was under baseline by 70.00%! Consider setting a new baseline.

   🏌️  number: ^
   ⛳ Result: 30 instantiations
   🎯 Baseline: 104 instantiations
   📉 number: ^ was under baseline by 71.15%! Consider setting a new baseline.

   🏌️  number: unary +
   ⛳ Result: 6 instantiations
   🎯 Baseline: 5 instantiations
   📊 Delta: +20.00%

   🏌️  number: unary -
   ⛳ Result: 6 instantiations
   🎯 Baseline: 6 instantiations
   📊 Delta: 0.00%

   🏌️  boolean: =
   ⛳ Result: 22 instantiations
   🎯 Baseline: 44 instantiations
   📉 boolean: = was under baseline by 50.00%! Consider setting a new baseline.

   🏌️  boolean: !=
   ⛳ Result: 22 instantiations
   🎯 Baseline: 48 instantiations
   📉 boolean: != was under baseline by 54.17%! Consider setting a new baseline.

   🏌️  boolean: >
   ⛳ Result: 22 instantiations
   🎯 Baseline: 52 instantiations
   📉 boolean: > was under baseline by 57.69%! Consider setting a new baseline.

   🏌️  boolean: <
   ⛳ Result: 22 instantiations
   🎯 Baseline: 56 instantiations
   📉 boolean: < was under baseline by 60.71%! Consider setting a new baseline.

   🏌️  boolean: >=
   ⛳ Result: 22 instantiations
   🎯 Baseline: 60 instantiations
   📉 boolean: >= was under baseline by 63.33%! Consider setting a new baseline.

   🏌️  boolean: <=
   ⛳ Result: 22 instantiations
   🎯 Baseline: 64 instantiations
   📉 boolean: <= was under baseline by 65.63%! Consider setting a new baseline.

   🏌️  boolean: ?=
   ⛳ Result: 26 instantiations
   🎯 Baseline: 68 instantiations
   📉 boolean: ?= was under baseline by 61.76%! Consider setting a new baseline.

   🏌️  boolean: ?!=
   ⛳ Result: 26 instantiations
   🎯 Baseline: 72 instantiations
   📉 boolean: ?!= was under baseline by 63.89%! Consider setting a new baseline.

   🏌️  boolean: and
   ⛳ Result: 22 instantiations
   🎯 Baseline: 76 instantiations
   📉 boolean: and was under baseline by 71.05%! Consider setting a new baseline.

   🏌️  boolean: or
   ⛳ Result: 22 instantiations
   🎯 Baseline: 80 instantiations
   📉 boolean: or was under baseline by 72.50%! Consider setting a new baseline.

   🏌️  boolean: not
   ⛳ Result: 5 instantiations
   🎯 Baseline: 6 instantiations
   📊 Delta: -16.67%

   🏌️  nested boolean: =
   ⛳ Result: 41 instantiations
   🎯 Baseline: 48 instantiations
   📊 Delta: -14.58%

   🏌️  string: ilike
   ⛳ Result: 12 instantiations
   🎯 Baseline: 94 instantiations
   📉 string: ilike was under baseline by 87.23%! Consider setting a new baseline.

   🏌️  string: not ilike
   ⛳ Result: 12 instantiations
   🎯 Baseline: 98 instantiations
   📉 string: not ilike was under baseline by 87.76%! Consider setting a new baseline.

   ❌ 'string: =' exceeded baseline by 50.00% (threshold is 20%).

Incredibly, everything with the exception of the very first operator and unary ``+`` got better. Let's save a commit with these changes to this branch.

.. code-block:: bash

   $ git commit -m "Use a union of operators"

I suggest making two separate commits: one with the changes to the implementation, and a second that updates the benchmark results. This makes it easier to compare approaches against the baseline, but also you can checkout the benchmark file across branches to compare how different approaches differ in the benchmarks. Let's update the benchmark results in the ``index.ts`` file, and commit another change.

.. code-block:: bash

   $ git commit -m "Update benchmark results"

Let's branch again and explore a new hypothesis that builds on the existing construct. We will use the existing experiment as the starting point for our new branch rather than starting over from the base. However we should branch from the previous commit instead of the commit that updated the benchmarks. Let's explore the hypothesis that the order of the overloads has an effect on the number of types the inference engine has to instantiate here. Let's order them such that the same operators are grouped together.

.. code-block:: bash

  $ git checkout -b 1234-experiments/union-operators/group-by-operators HEAD~1

Making our adjustments, we see the following benchmark results:

.. code-block:: bash
  :class: collapsible

   $ npx tsx bench.ts
   🏌️  string: =
   ⛳ Result: 12 instantiations
   🎯 Baseline: 8 instantiations
   📈 'string: =' exceeded baseline by 50.00% (threshold is 20%).

   🏌️  string: !=
   ⛳ Result: 12 instantiations
   🎯 Baseline: 12 instantiations
   📊 Delta: 0.00%

   🏌️  string: >
   ⛳ Result: 12 instantiations
   🎯 Baseline: 16 instantiations
   📉 string: > was under baseline by 25.00%! Consider setting a new baseline.

   🏌️  string: <
   ⛳ Result: 12 instantiations
   🎯 Baseline: 20 instantiations
   📉 string: < was under baseline by 40.00%! Consider setting a new baseline.

   🏌️  string: >=
   ⛳ Result: 12 instantiations
   🎯 Baseline: 24 instantiations
   📉 string: >= was under baseline by 50.00%! Consider setting a new baseline.

   🏌️  string: <=
   ⛳ Result: 12 instantiations
   🎯 Baseline: 28 instantiations
   📉 string: <= was under baseline by 57.14%! Consider setting a new baseline.

   🏌️  string: ?=
   ⛳ Result: 24 instantiations
   🎯 Baseline: 32 instantiations
   📉 string: ?= was under baseline by 25.00%! Consider setting a new baseline.

   🏌️  string: ?!=
   ⛳ Result: 24 instantiations
   🎯 Baseline: 36 instantiations
   📉 string: ?!= was under baseline by 33.33%! Consider setting a new baseline.

   🏌️  string: ++
   ⛳ Result: 8 instantiations
   🎯 Baseline: 102 instantiations
   📉 string: ++ was under baseline by 92.16%! Consider setting a new baseline.

   🏌️  number: =
   ⛳ Result: 14 instantiations
   🎯 Baseline: 26 instantiations
   📉 number: = was under baseline by 46.15%! Consider setting a new baseline.

   🏌️  number: !=
   ⛳ Result: 14 instantiations
   🎯 Baseline: 30 instantiations
   📉 number: != was under baseline by 53.33%! Consider setting a new baseline.

   🏌️  number: >
   ⛳ Result: 14 instantiations
   🎯 Baseline: 34 instantiations
   📉 number: > was under baseline by 58.82%! Consider setting a new baseline.

   🏌️  number: <
   ⛳ Result: 14 instantiations
   🎯 Baseline: 38 instantiations
   📉 number: < was under baseline by 63.16%! Consider setting a new baseline.

   🏌️  number: >=
   ⛳ Result: 14 instantiations
   🎯 Baseline: 42 instantiations
   📉 number: >= was under baseline by 66.67%! Consider setting a new baseline.

   🏌️  number: <=
   ⛳ Result: 14 instantiations
   🎯 Baseline: 46 instantiations
   📉 number: <= was under baseline by 69.57%! Consider setting a new baseline.

   🏌️  number: ?=
   ⛳ Result: 24 instantiations
   🎯 Baseline: 50 instantiations
   📉 number: ?= was under baseline by 52.00%! Consider setting a new baseline.

   🏌️  number: ?!=
   ⛳ Result: 24 instantiations
   🎯 Baseline: 54 instantiations
   📉 number: ?!= was under baseline by 55.56%! Consider setting a new baseline.

   🏌️  number: +
   ⛳ Result: 30 instantiations
   🎯 Baseline: 80 instantiations
   📉 number: + was under baseline by 62.50%! Consider setting a new baseline.

   🏌️  number: -
   ⛳ Result: 30 instantiations
   🎯 Baseline: 84 instantiations
   📉 number: - was under baseline by 64.29%! Consider setting a new baseline.

   🏌️  number: *
   ⛳ Result: 30 instantiations
   🎯 Baseline: 88 instantiations
   📉 number: * was under baseline by 65.91%! Consider setting a new baseline.

   🏌️  number: /
   ⛳ Result: 30 instantiations
   🎯 Baseline: 92 instantiations
   📉 number: / was under baseline by 67.39%! Consider setting a new baseline.

   🏌️  number: %
   ⛳ Result: 30 instantiations
   🎯 Baseline: 96 instantiations
   📉 number: % was under baseline by 68.75%! Consider setting a new baseline.

   🏌️  number: //
   ⛳ Result: 30 instantiations
   🎯 Baseline: 100 instantiations
   📉 number: // was under baseline by 70.00%! Consider setting a new baseline.

   🏌️  number: ^
   ⛳ Result: 30 instantiations
   🎯 Baseline: 104 instantiations
   📉 number: ^ was under baseline by 71.15%! Consider setting a new baseline.

   🏌️  number: unary +
   ⛳ Result: 6 instantiations
   🎯 Baseline: 5 instantiations
   📊 Delta: +20.00%

   🏌️  number: unary -
   ⛳ Result: 6 instantiations
   🎯 Baseline: 6 instantiations
   📊 Delta: 0.00%

   🏌️  boolean: =
   ⛳ Result: 18 instantiations
   🎯 Baseline: 44 instantiations
   📉 boolean: = was under baseline by 59.09%! Consider setting a new baseline.

   🏌️  boolean: !=
   ⛳ Result: 18 instantiations
   🎯 Baseline: 48 instantiations
   📉 boolean: != was under baseline by 62.50%! Consider setting a new baseline.

   🏌️  boolean: >
   ⛳ Result: 18 instantiations
   🎯 Baseline: 52 instantiations
   📉 boolean: > was under baseline by 65.38%! Consider setting a new baseline.

   🏌️  boolean: <
   ⛳ Result: 18 instantiations
   🎯 Baseline: 56 instantiations
   📉 boolean: < was under baseline by 67.86%! Consider setting a new baseline.

   🏌️  boolean: >=
   ⛳ Result: 18 instantiations
   🎯 Baseline: 60 instantiations
   📉 boolean: >= was under baseline by 70.00%! Consider setting a new baseline.

   🏌️  boolean: <=
   ⛳ Result: 18 instantiations
   🎯 Baseline: 64 instantiations
   📉 boolean: <= was under baseline by 71.88%! Consider setting a new baseline.

   🏌️  boolean: ?=
   ⛳ Result: 26 instantiations
   🎯 Baseline: 68 instantiations
   📉 boolean: ?= was under baseline by 61.76%! Consider setting a new baseline.

   🏌️  boolean: ?!=
   ⛳ Result: 26 instantiations
   🎯 Baseline: 72 instantiations
   📉 boolean: ?!= was under baseline by 63.89%! Consider setting a new baseline.

   🏌️  boolean: and
   ⛳ Result: 18 instantiations
   🎯 Baseline: 76 instantiations
   📉 boolean: and was under baseline by 76.32%! Consider setting a new baseline.

   🏌️  boolean: or
   ⛳ Result: 18 instantiations
   🎯 Baseline: 80 instantiations
   📉 boolean: or was under baseline by 77.50%! Consider setting a new baseline.

   🏌️  boolean: not
   ⛳ Result: 5 instantiations
   🎯 Baseline: 6 instantiations
   📊 Delta: -16.67%

   🏌️  nested boolean: =
   ⛳ Result: 39 instantiations
   🎯 Baseline: 48 instantiations
   📊 Delta: -18.75%

   🏌️  string: ilike
   ⛳ Result: 12 instantiations
   🎯 Baseline: 94 instantiations
   📉 string: ilike was under baseline by 87.23%! Consider setting a new baseline.

   🏌️  string: not ilike
   ⛳ Result: 12 instantiations
   🎯 Baseline: 98 instantiations
   📉 string: not ilike was under baseline by 87.76%! Consider setting a new baseline.

   ❌ 'string: =' exceeded baseline by 50.00% (threshold is 20%).


This implementation is also great! Is it better than the previous experiment? We can check by checking out the benchmark commit from the other branch.

.. code-block:: bash
  :class: collapsible

   $ git checkout 1234-experiments/union-operators -- index.ts
   $ npx tsx index.ts
   🏌️  string: =
   ⛳ Result: 12 instantiations
   🎯 Baseline: 12 instantiations
   📊 Delta: 0.00%

   🏌️  string: !=
   ⛳ Result: 12 instantiations
   🎯 Baseline: 12 instantiations
   📊 Delta: 0.00%

   🏌️  string: >
   ⛳ Result: 12 instantiations
   🎯 Baseline: 12 instantiations
   📊 Delta: 0.00%

   🏌️  string: <
   ⛳ Result: 12 instantiations
   🎯 Baseline: 12 instantiations
   📊 Delta: 0.00%

   🏌️  string: >=
   ⛳ Result: 12 instantiations
   🎯 Baseline: 12 instantiations
   📊 Delta: 0.00%

   🏌️  string: <=
   ⛳ Result: 12 instantiations
   🎯 Baseline: 12 instantiations
   📊 Delta: 0.00%

   🏌️  string: ?=
   ⛳ Result: 24 instantiations
   🎯 Baseline: 16 instantiations
   📈 'string: ?=' exceeded baseline by 50.00% (threshold is 20%).

   🏌️  string: ?!=
   ⛳ Result: 24 instantiations
   🎯 Baseline: 16 instantiations
   📈 'string: ?!=' exceeded baseline by 50.00% (threshold is 20%).

   🏌️  string: ++
   ⛳ Result: 8 instantiations
   🎯 Baseline: 8 instantiations
   📊 Delta: 0.00%

   🏌️  number: =
   ⛳ Result: 14 instantiations
   🎯 Baseline: 16 instantiations
   📊 Delta: -12.50%

   🏌️  number: !=
   ⛳ Result: 14 instantiations
   🎯 Baseline: 16 instantiations
   📊 Delta: -12.50%

   🏌️  number: >
   ⛳ Result: 14 instantiations
   🎯 Baseline: 16 instantiations
   📊 Delta: -12.50%

   🏌️  number: <
   ⛳ Result: 14 instantiations
   🎯 Baseline: 16 instantiations
   📊 Delta: -12.50%

   🏌️  number: >=
   ⛳ Result: 14 instantiations
   🎯 Baseline: 16 instantiations
   📊 Delta: -12.50%

   🏌️  number: <=
   ⛳ Result: 14 instantiations
   🎯 Baseline: 16 instantiations
   📊 Delta: -12.50%

   🏌️  number: ?=
   ⛳ Result: 24 instantiations
   🎯 Baseline: 20 instantiations
   📊 Delta: +20.00%

   🏌️  number: ?!=
   ⛳ Result: 24 instantiations
   🎯 Baseline: 20 instantiations
   📊 Delta: +20.00%

   🏌️  number: +
   ⛳ Result: 30 instantiations
   🎯 Baseline: 30 instantiations
   📊 Delta: 0.00%

   🏌️  number: -
   ⛳ Result: 30 instantiations
   🎯 Baseline: 30 instantiations
   📊 Delta: 0.00%

   🏌️  number: *
   ⛳ Result: 30 instantiations
   🎯 Baseline: 30 instantiations
   📊 Delta: 0.00%

   🏌️  number: /
   ⛳ Result: 30 instantiations
   🎯 Baseline: 30 instantiations
   📊 Delta: 0.00%

   🏌️  number: %
   ⛳ Result: 30 instantiations
   🎯 Baseline: 30 instantiations
   📊 Delta: 0.00%

   🏌️  number: //
   ⛳ Result: 30 instantiations
   🎯 Baseline: 30 instantiations
   📊 Delta: 0.00%

   🏌️  number: ^
   ⛳ Result: 30 instantiations
   🎯 Baseline: 30 instantiations
   📊 Delta: 0.00%

   🏌️  number: unary +
   ⛳ Result: 6 instantiations
   🎯 Baseline: 6 instantiations
   📊 Delta: 0.00%

   🏌️  number: unary -
   ⛳ Result: 6 instantiations
   🎯 Baseline: 6 instantiations
   📊 Delta: 0.00%

   🏌️  boolean: =
   ⛳ Result: 18 instantiations
   🎯 Baseline: 22 instantiations
   📊 Delta: -18.18%

   🏌️  boolean: !=
   ⛳ Result: 18 instantiations
   🎯 Baseline: 22 instantiations
   📊 Delta: -18.18%

   🏌️  boolean: >
   ⛳ Result: 18 instantiations
   🎯 Baseline: 22 instantiations
   📊 Delta: -18.18%

   🏌️  boolean: <
   ⛳ Result: 18 instantiations
   🎯 Baseline: 22 instantiations
   📊 Delta: -18.18%

   🏌️  boolean: >=
   ⛳ Result: 18 instantiations
   🎯 Baseline: 22 instantiations
   📊 Delta: -18.18%

   🏌️  boolean: <=
   ⛳ Result: 18 instantiations
   🎯 Baseline: 22 instantiations
   📊 Delta: -18.18%

   🏌️  boolean: ?=
   ⛳ Result: 26 instantiations
   🎯 Baseline: 26 instantiations
   📊 Delta: 0.00%

   🏌️  boolean: ?!=
   ⛳ Result: 26 instantiations
   🎯 Baseline: 26 instantiations
   📊 Delta: 0.00%

   🏌️  boolean: and
   ⛳ Result: 18 instantiations
   🎯 Baseline: 22 instantiations
   📊 Delta: -18.18%

   🏌️  boolean: or
   ⛳ Result: 18 instantiations
   🎯 Baseline: 22 instantiations
   📊 Delta: -18.18%

   🏌️  boolean: not
   ⛳ Result: 5 instantiations
   🎯 Baseline: 5 instantiations
   📊 Delta: 0.00%

   🏌️  nested boolean: =
   ⛳ Result: 39 instantiations
   🎯 Baseline: 41 instantiations
   📊 Delta: -4.88%

   🏌️  string: ilike
   ⛳ Result: 12 instantiations
   🎯 Baseline: 12 instantiations
   📊 Delta: 0.00%

   🏌️  string: not ilike
   ⛳ Result: 12 instantiations
   🎯 Baseline: 12 instantiations
   📊 Delta: 0.00%

   ❌ 'string: ?=' exceeded baseline by 50.00% (threshold is 20%).
   ❌ 'string: ?!=' exceeded baseline by 50.00% (threshold is 20%).

It looks like it's consistently better with the exception of the ``?=`` and ``?!=`` operators, which makes some sense since it has moved further down the list of overloads. We can choose to abandon the original branch, and make this a new top-level experimental branch, or keep them both around. We'll still split this experiment into two separate commits: the first that changes the implementation, and the second that updates the benchmarks.

Let's look at another idea: maybe instead of clustering by operator, we should cluster by operand. After adjusting and benchmarking, it turns out this has roughly the same performance as ``1234-experiments/union-operators`` which since that branch just happened to be incidentally clustered by operand. A few of the operators got a little better, and a few got measureably worse. It is across-the-board worse than ``1234-experiments/group-by-operator``, so we can abandon this new branch, and explore in other directions.

As you can see, having benchmarks that track the number of type instantiations for a given expression allows us to quantify our experiments, turning wild guesses on what might be faster into concrete measurements. Often, different patterns of making a type present different trade-offs and it is difficult to know the overall impact of a change if you do not have some kind of comprehensive way to quantify the impact of a change.

Some general advice
===================

While the specific focus of this post is about *how* to measure changes, I'd like to also provide a few rules of thumb that might apply and can be good starting points for your own experiments. Some of this is general advice from the TypeScript wiki, and some of this I've discovered after doing experiments.

Prefer interfaces over intersections
------------------------------------

As noted in the TypeScript performance wiki:

.. pull-quote::

  Type relationships between interfaces are also cached, as opposed to intersection types as a whole. A final noteworthy difference is that when checking against a target intersection type, every constituent is checked before checking against the "effective"/"flattened" type.

Example:

.. code-block:: typescript-diff

  - type Foo = Bar & Baz & {
  -     someProp: string;
  - }
  + interface Foo extends Bar, Baz {
  +     someProp: string;
  + }


Name conditional types
----------------------

Another good one from the TypeScript performance wiki:

.. pull-quote::

  This is convenient, but today, every time ``foo`` is called, TypeScript has to re-run the conditional type. What's more, relating any two instances of ``SomeType`` requires re-relating the structure of the return type of ``foo``.

  If the return type in this example was extracted out to a type alias, more information can be cached by the compiler:

Example:

.. code-block:: typescript-diff

  - interface SomeType<T> {
  -   foo<U>(x: U):
  -     U extends TypeA<T> ? ProcessTypeA<U, T> :
  -     U extends TypeB<T> ? ProcessTypeB<U, T> :
  -     U extends TypeC<T> ? ProcessTypeC<U, T> :
  -     U;
  - }
  + type FooResult<U, T> =
  +   U extends TypeA<T> ? ProcessTypeA<U, T> :
  +   U extends TypeB<T> ? ProcessTypeB<U, T> :
  +   U extends TypeC<T> ? ProcessTypeC<U, T> :
  +   U;
  +
  + interface SomeType<T> {
  +   foo<U>(x: U): FooResult<U, T>;
  + }

Move expensive types into generics
----------------------------------

Type aliases have two "halves":

1. The "left" side of the alias, which is the name of the type alias and defines any generics and their constraints
2. The "right" side of the alias, which is the type that the alias refers to

Moving expensive generic expressions from the "right" side of a type alias to a new generic parameter on the "left" can sometimes improve performance. However, this approach isn't universally beneficial and may require providing default values or explicit generic arguments. Always measure the impact of such changes to ensure they actually improve performance in your specific case.

Example:

.. code-block:: typescript-diff

    export function op<
      Opr1 extends TypeSet<$String>,
      Opr2 extends TypeSet<$String>,
  +   Result extends $expr_Operator<
  +     Opr1["__element__"],
  +     multiplyCardinalities<paramCardinality<Opr1>, paramCardinality<Opr2>>
  +   >,
  + >(op1: Opr1, op: "=", op2: Opr2): Result;
  - >(op1: Opr1, op: "=", op2: Opr2): $expr_Operator<
  -    Opr1["__element__"],
  -    multiplyCardinalities<paramCardinality<Opr1>, paramCardinality<Opr2>>
  -  >;
    };

Order of conditionals matters
-----------------------------

When creating a conditional type with a few conditions, the order of the conditions matters. The type checker will stop evaluating the rest of the conditions as soon as it finds a match, so you can "tune" how expensive a particular case is by moving it earlier or later in the conditional.

Here's a very contrived example, which borrows an expensive type from ``arktype``:

Example:

.. code-block:: typescript

  import { bench } from "@ark/attest";
  import { type, type inferAmbient } from "arktype";

  bench.baseline(() => type("never"))

  type StrangeType<T> = T extends 0
    ? 0
    : T extends 1
      ? 1
      : T extends 2
        ? inferAmbient<"(0|(1|(2|(3|(4|5)[])[])[])[])[]">
        : T;

  bench("StrangeType: 0", () => {
    type T = StrangeType<0>;
  }).types([2, "instantiations"]);

  bench("StrangeType: 1", () => {
    type T = StrangeType<1>;
  }).types([3, "instantiations"]);

  bench("StrangeType: 2", () => {
    type T = StrangeType<2>;
  }).types([81, "instantiations"]);

  bench("StrangeType: 3", () => {
    type T = StrangeType<3>;
  }).types([5, "instantiations"]);

Our expensive conditional branch ``2`` takes 81 instantiations. Let's move it first and see what happens:

.. code-block:: typescript

  type StrangeType<T> = T extends 2
    ? inferAmbient<"(0|(1|(2|(3|(4|5)[])[])[])[])[]">
    : T extends 0
      ? 0
      : T extends 1
        ? 1
        : T;

In this version, the expensive case only costs 79 instantiations, but each of the earlier cases cost an additional instantiation due to the ``T extends 2`` check now coming before them.

Sometimes, it can be useful to rearrange your conditionals to either make the most expensive or the most common cases cheaper. Sometimes you have a clear win if the most expensive cases are also very common cases, but you'll need to know a bit about the specifics of your use case to make that decision.

The next generation of performance tools
========================================

Like many performance related issues, learning the tips and tricks of improving type inference performance is a temporary skill, but learning how to measure and quantify the impact of a change is a perennial skill that will continue to be useful no matter how TypeScript evolves.

To that end, I'd love to see more tooling around type performance in the future. I'm aware of some projects that are in the early stage of development for this purpose. Here are some concrete things that are currently difficult that would improve this method of performance improvement iteration:

1. Measure the impact of a change on the language server wall time
2. Trace the language server performance of a given expression and see what exactly the inference engine is doing (what types are being instantiated, what the call stack looks like, etc)
3. Linting tools that provide performance-specific guidance
4. Refactoring tool at the type level that help large refactors of types similar to runtime refactoring
