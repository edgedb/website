.. blog:authors:: james
.. blog:published-on:: 2022-05-26 1:00 PM PT
.. blog:lead-image:: images/deno_comp.jpg
.. blog:guid:: 4e67b969-9e50-4d01-9db4-d67c62537b33
.. blog:description::
    A general purpose methodology for converting a Node.js package to Deno.

=========================================================
How we converted our Node.js library to Deno (using Deno)
=========================================================

Deno is a new runtime for JavaScript that supports TypeScript natively without
the need for compilation. It was created by Ryan Dahl, the creator of Node.js, to solve some of Node's fundamental design and security flaws and embrace modern best practices like ES Modules and TypeScript.

At EdgeDB, we built and maintain a `first-party client library <https://github.com/edgedb/edgedb-js>`_ for Node.js that's available as the ``edgedb`` module on NPM. However, Deno uses a totally different set of practices to handle dependencies, namely direct URL ``imports`` from public package registries like `deno.land/x <https://deno.land/x>`__. We set out to find a simple way to "Denoify" our codebase; that is, generate a Deno-compatible module from our existing Node.js implementation with minimal refactoring. This frees us from the complexity of maintaining and synchronizing two nearly identical codebases.

We landed on a "runtime adapter" pattern that we think represents a general-purpose approach that may be useful to other library authors looking to support Deno.

Node.js vs Deno
---------------

There are a few key differences between the Node.js and Deno runtimes that we
will have to take into account when adapting our library written for Node.js:

1. **TypeScript support**: Deno can directly execute TypeScript files, while Node.js can only run JavaScript code.

2. **Module resolution**: By default, Node.js imports modules in the CommonJS format and expects ``require/module.exports`` syntax. It also has a complex `resolution algorithm <https://www.typescriptlang.org/docs/handbook/module-resolution.html>`_, which will load plain module names like ``"react"`` from ``node_modules``, append ``.js`` or ``.json`` as needed to extensionless imports, and import the ``index.js`` file if the import path is a directory.

   Deno simplifies this dramatically. It uses the ECMAScript module syntax ``import`` and ``export``, also known as "ES modules" or just "ESM". This syntax is also used by TypeScript. All imports must be either a) a relative path with an explicit file extensions or b) a URL.

   This means there is no ``node_modules`` or package manager like ``npm`` or ``yarn``; external modules are simply imported directly via a URL from a publicly available code repository, like `deno.land/x <https://deno.land/x/>`__ or GitHub.

3. **Standard library**: Node.js has a builtin set of `standard modules <https://www.w3schools.com/nodejs/ref_modules.asp>`_ like ``fs``, ``path``, ``crypto``, and ``http``, among others. These modules can be directly required with ``require('fs')`` and their names are reserved by Node.js. By contrast, the Deno standard library is imported via URL from the ``https://deno.land/std/`` registry. The functionality of the two standard libraries also differs, with Deno abandoning some old or outdated Node.js APIs, introducing a new standard library (inspired by that of Go), and uniformly supporting modern JavaScript features like Promises (whereas many Node.js APIs still rely on the older callback style).

4. **Built-in globals**: Deno contains all of its core APIs under a single global variable called ``Deno`` and otherwise only exposes standard web APIs. Unlike Node.js, there is no global ``Buffer`` or ``process`` variable available.

So how can we work around these differences and get our Node.js library running in Deno as painlessly as possible? Let's go through these changes one by one.


TypeScript and module syntax
----------------------------

Fortunately, we don't need to worry much about converting CommonJS ``require/module.exports`` syntax to ESM ``import/export``. We wrote ``edgedb-js`` entirely in TypeScript, which already uses ESM syntax. During compilation, ``tsc`` converts our files to plain JavaScript files utilizing CommonJS ``require`` syntax. The compiled files are directly consumable by Node.js.

The rest of this post will discuss how we modify our TypeScript source files to a format that is directly consumable by Deno.

Dependencies
------------

Fortunately ``edgedb-js`` doesn't have any third-party dependencies, so we don't have to worry about the Deno compatibility of any external libraries. However, we need to replace all imports from the Node.js standard library (e.g. ``path``, ``fs``, etc) with a Deno equivalent.

.. note::

  If your package does depend on external packages, check ``deno.land/x`` to see if a Deno version if available. If so, read on; if not, you'll need to work with the module author to make a Deno version available.

This task is made far simpler by the existence of the `Node.js compatibility module <https://deno.land/std@0.140.0/node>`_ provided by the Deno standard library. This module provides a wrapper over Deno's standard library that attempts to adhere as faithfully as possible to Node's API.

.. code-block:: typescript-diff

  - import * as crypto from "crypto";
  + import * as crypto from "https://deno.land/std@0.114.0/node/crypto.ts";

To simplify things, we moved all imports of Node.js APIs to a single file called ``adapter.node.ts`` and re-export only the functionality we need.

.. code-block:: typescript

  // adapter.node.ts
  import * as path from "path";
  import * as util from "util";
  import * as crypto from "crypto";

  export {path, net, crypto};


We then implement the same adapter for Deno in a file called ``adapter.deno.ts``.

.. code-block:: typescript

  // adapter.deno.ts
  import * as crypto from "https://deno.land/std@0.114.0/node/crypto.ts";
  import path from "https://deno.land/std@0.114.0/node/path.ts";
  import util from "https://deno.land/std@0.114.0/node/util.ts";

  export {path, util, crypto};

Whenever we need Node.js specific functionality, we import it from ``adapter.node.ts`` directly. This way, we can make ``edgedb-js`` Deno-compatible by simply rewriting all imports of ``adapter.node.ts`` to ``adapter.deno.ts``. As long as these files re-export the same functionality, everything should work as expected.

.. This method could also be used to handle the use of Node.js globals across the library; first adding an explicit import of the global from this adapter file wherever we use it, then adding export of that global to the adapter and its polyfill version to the Deno adapter we swap in. We however didn't quite do that for ``edgedb-js`` as explained later.


Practically speaking, how do we actually rewrite these imports? Well, we need to write a simple codemod script. And just to make it a bit more poetic, we'll write this script using Deno itself.

.. Next is the issue of how to actually implement this swapping out of the ``adapter.*.ts`` file. There are two possible approaches to handling the module resolution differences and swapping in the correct adapter:

.. 1. Deno first: We could change ``edgedb-js`` to be written in a Deno first way, which would mean changing the library to import from the Deno version of the dependencies adapter by default, explicitly importing the polyfilled Node.js globals, and writing imports with full relative paths with extensions. This is possibly the most straightforward approach, since the Node.js version of ``edgedb-js`` needs to be compiled to plain js anyway, and we could switch to a build tool like esbuild which would make it easy to swap out imports of the default deno adapter with the Node.js adaptor. To note here, while the TypeScript compiler ``tsc`` does have the ``paths`` compiler option, which would allow the adapter import to be replaced, it doesn't allow imports with file extensions, hence the need for a build tool like esbuild.

..    However for ``edgedb-js`` we opted for another approach:

.. 2. Node first: For ``edgedb-js`` we wanted the library, for now, to remain being written in a Node.js first manner. Now obviously we don't want to be maintaining a Deno branch of ``edgedb-js`` manually, so what we need is a tool that can generate a Deno version of ``edgedb-js`` automatically that we can run at build time.

.. Since we're creating this branch of ``edgedb-js`` for Deno, let's build this tool in Deno itself. Building a custom tool also allows us to restructure the generated library in a more idiomatic way for deno, where it is common to have the main file that exports the library's API in the root directory with the name 'mod.ts', and have the internal parts of the library prefixed with an underscore.

Writing a Deno-ifier
--------------------

Before we get started building, let's outline what steps this tool needs to do:

- Rewrite the Node.js-style imports to the more explicit style Deno. This includes adding the ``.ts`` file extension and adding ``/index.ts`` to all directory imports.
- Swapping out all imports from ``adapter.node`` to ``adapter.deno.ts``.
- Inject Node.js globals like ``process`` and ``Buffer`` into the Deno-ified code. While we could simply export these variables from our adapters, we'd have to refactor our Node.js files to explicitly import them. To simplify things, we'll detect where Node.js globals are used and inject an import as needed.
- Rename the ``src`` directory to ``_src`` to denote that it holds the internals of ``edgedb-js`` and shouldn't be imported directly
- Move the main ``src/index.node.ts`` file to the project root and rename it ``mod.ts``. This is idiomatic in Deno. (Note: the naming of
  ``index.node.ts`` here doesn't indicate that it's Node-specific; it's indented to differentiate it from ``index.browser.ts``, which exports all browser-compatible parts of ``edgedb-js``.)

Create a list of all files
^^^^^^^^^^^^^^^^^^^^^^^^^^

Let's jump in. First, we need to compute a list of our source files. The
``walk`` function provided by Deno's native ``fs`` module will do:

.. code-block:: typescript

  import {walk} from "https://deno.land/std@0.114.0/fs/mod.ts";

  const sourceDir = "./src";
  for await (const entry of walk(sourceDir, {includeDirs: false})) {
    // iterate through all files
  }

.. note::

  Note that we're using Deno's native ``std/fs`` module, *not* the Node compatibility version ``std/node/fs``.

Let's declare a set of rewrite rules and initialize a ``Map`` that will map from a source file path to the rewritten destination path.

.. code-block:: typescript-diff

    const sourceDir = "./src";
  + const destDir = "./edgedb-deno";
  + const pathRewriteRules = [
  +   {match: /^src\/index.node.ts$/, replace: "mod.ts"},
  +   {match: /^src\//, replace: "_src/"},
  + ];

  + const sourceFilePathMap = new Map<string, string>();

    for await (const entry of walk(sourceDir, {includeDirs: false})) {
  +   const sourcePath = entry.path;
  +   sourceFilePathMap.set(sourcePath, resolveDestPath(sourcePath));
    }

  + function resolveDestPath(sourcePath: string) {
  +   let destPath = sourcePath;
  +   // apply all rewrite rules
  +   for (const rule of pathRewriteRules) {
  +     destPath = destPath.replace(rule.match, rule.replace);
  +   }
  +   return join(destDir, destPath);
  + }

That's the easy part; now lets start modifying the source code itself.


Rewrite imports and exports
^^^^^^^^^^^^^^^^^^^^^^^^^^^

To rewrite the import paths, we need to know where they are in the file; fortunately TypeScript exposes its `Compiler API <https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API>`_, which we'll use to parse the source files into an abstract syntax tree (AST) and find the import declarations.

To do so, we need to import the compiler API directly from the ``"typescript"`` NPM module. Fortunately, Deno's compatibility module provides a way to require CommonJS modules without much hassle. This does require the use of the ``--unstable`` flag when running Deno, but for a build step like this, it's not a problem.

.. code-block:: typescript

  import {createRequire} from "https://deno.land/std@0.114.0/node/module.ts";

  const require = createRequire(import.meta.url);
  const ts = require("typescript");

Let's iterate through the files and parse each one in turn.

.. code-block:: typescript

  import {walk, ensureDir} from "https://deno.land/std@0.114.0/fs/mod.ts";
  import {createRequire} from "https://deno.land/std@0.114.0/node/module.ts";

  const require = createRequire(import.meta.url);
  const ts = require("typescript");

  for (const [sourcePath, destPath] of sourceFilePathMap) {
    compileFileForDeno(sourcePath, destPath);
  }

  async function compileFileForDeno(sourcePath: string, destPath: string) {
    const file = await Deno.readTextFile(sourcePath);
    await ensureDir(dirname(destPath));

    // if file ends with '.deno.ts', copy the file unchanged
    if (destPath.endsWith(".deno.ts")) return Deno.writeTextFile(destPath, file);
    // if file ends with '.node.ts', skip file
    if (destPath.endsWith(".node.ts")) return;

    // parse the source file using the typescript Compiler API
    const parsedSource = ts.createSourceFile(
      basename(sourcePath),
      file,
      ts.ScriptTarget.Latest,
      false,
      ts.ScriptKind.TS
    );
  }

For each parsed AST, let's iterate through its top-level nodes to find ``import`` and ``export`` declarations. We don't need to look deeper, because ``import/export`` are always top-level statements (with the exception of dynamic ``import()``, but we don't use those in ``edgedb-js``).

From these nodes, we extract the start and end offsets of the ``import/export`` path in the source file. We can then rewrite the import by slicing out the current contents and inserting a modified path.

.. code-block:: typescript-diff

    const parsedSource = ts.createSourceFile(/*...*/);

  + const rewrittenFile: string[] = [];
  + let cursor = 0;
  + parsedSource.forEachChild((node: any) => {
  +   if (
  +     (node.kind === ts.SyntaxKind.ImportDeclaration ||
  +       node.kind === ts.SyntaxKind.ExportDeclaration) &&
  +     node.moduleSpecifier
  +   ) {
  +     const pos = node.moduleSpecifier.pos + 2;
  +     const end = node.moduleSpecifier.end - 1;
  +     const importPath = file.slice(pos, end);
  +
  +     rewrittenFile.push(file.slice(cursor, pos));
  +     cursor = end;
  +
  +     // replace the adapter import with Deno version
  +     let resolvedImportPath = resolveImportPath(importPath, sourcePath);
  +     if (resolvedImportPath.endsWith("/adapter.node.ts")) {
  +       resolvedImportPath = resolvedImportPath.replace(
  +         "/adapter.node.ts",
  +         "/adapter.deno.ts"
  +       );
  +     }
  +
  +     rewrittenFile.push(resolvedImportPath);
  +   }
  + });
  +
  + rewrittenFile.push(file.slice(cursor));

The key part here is the ``resolveImportPath`` function, which converts a Node-style local import to the Deno style through trial-and-error. First it checks if the path corresponds to an actual file on disk; it that fails, it tries appending ``.ts``; if that fails, it tries appending ``/index.ts``; if that fails, an error is thrown.

.. .. code-block:: typescript

..   import { join, relative, dirname, basename } from "https://deno.land/std@0.114.0/path/posix.ts";
..   function resolveImportPath(importPath: string, sourcePath: string) {
..     let resolvedPath = join(dirname(sourcePath), importPath);
..     if (!sourceFilePathMap.has(resolvedPath)) {
..       // if importPath doesn't exist, first try appending '.ts'
..       resolvedPath = join(dirname(sourcePath), importPath + ".ts");
..       if (!sourceFilePathMap.has(resolvedPath)) {
..         // if that path doesn't exist, next try appending '/index.ts'
..         resolvedPath = join(dirname(sourcePath), importPath + "/index.ts");
..         if (!sourceFilePathMap.has(resolvedPath)) {
..           throw new Error(
..             `Cannot find imported file '${importPath}' in '${sourcePath}'`
..           );
..         }
..       }
..     }

..     // now resolve the relative path after the source files have been mapped to
..     // their dest paths
..     const relImportPath = relative(
..       dirname(sourceFilePathMap.get(sourcePath)!),
..       sourceFilePathMap.get(resolvedPath)!
..     );
..     return relImportPath.startsWith("../")
..       ? relImportPath
..       : "./" + relImportPath;
..   }

Inject Node.js globals
^^^^^^^^^^^^^^^^^^^^^^

The final step is to handle the Node.js globals. First, we create a ``globals.deno.ts`` file in our project directory. This file should export the compatibility versions of all Node.js globals that are used in your package.

.. code-block:: typescript

  export {Buffer} from "https://deno.land/std@0.114.0/node/buffer.ts";
  export {process} from "https://deno.land/std@0.114.0/node/process.ts";


The compiled AST helpfully provides a ``Set`` of all identifiers used in the source file. We'll use that to inject an import statement in any file that references these globals.

.. code-block:: typescript-diff

    const sourceDir = "./src";
    const destDir = "./edgedb-deno";
    const pathRewriteRules = [
      {match: /^src\/index.node.ts$/, replace: "mod.ts"},
      {match: /^src\//, replace: "_src/"},
    ];
  + const injectImports = {
  +   imports: ["Buffer", "process"],
  +   from: "src/globals.deno.ts",
  + };

    // ...

    const rewrittenFile: string[] = [];
    let cursor = 0;
  + let isFirstNode = true;
    parsedSource.forEachChild((node: any) => {
  +   if (isFirstNode) {  // only run once per file
  +     isFirstNode = false;
  +
  +     const neededImports = injectImports.imports.filter((importName) =>
  +       parsedSource.identifiers?.has(importName)
  +     );
  +
  +     if (neededImports.length) {
  +       const imports = neededImports.join(", ");
  +       const importPath = resolveImportPath(
  +         relative(dirname(sourcePath), injectImports.from),
  +         sourcePath
  +       );
  +       const importDecl = `import {${imports}} from "${importPath}";\n\n`;
  +
  +       const injectPos = node.getLeadingTriviaWidth?.(parsedSource) ?? node.pos;
  +       rewrittenFile.push(file.slice(cursor, injectPos));
  +       rewrittenFile.push(importDecl);
  +       cursor = injectPos;
  +     }
  +   }
  +

Writing the files
^^^^^^^^^^^^^^^^^

Finally, we're ready to write the rewritten source file to its new home in the destination directory. First, we delete any existing contents, then write each file in turn.

.. code-block:: typescript-diff

  + try {
  +   await Deno.remove(destDir, {recursive: true});
  + } catch {}

    const sourceFilePathMap = new Map<string, string>();
    for (const [sourcePath, destPath] of sourceFilePathMap) {
      // rewrite file
  +   await Deno.writeTextFile(destPath, rewrittenFile.join(""));
    }

Continuous integration
^^^^^^^^^^^^^^^^^^^^^^

A common pattern is to maintain a separate auto-generated repo for the Deno version of your package. In our case, we generate the Deno version of ``edgedb-js`` inside GitHub Actions whenever a new commit is merged into ``master``. The generated files are then published to a sister repository called `edgedb-deno <https://github.com/edgedb/edgedb-deno>`_. Below is a simplified version of our workflow file.

.. code-block:: yaml

  # .github/workflows/deno-release.yml
  name: Deno Release
  on:
    push:
      branches:
        - master
  jobs:
    release:
      runs-on: ubuntu-latest
      steps:
        - name: Checkout edgedb-js
          uses: actions/checkout@v2
        - name: Checkout edgedb-deno
          uses: actions/checkout@v2
          with:
            token: ${{ secrets.GITHUB_TOKEN }}
            repository: edgedb/edgedb-deno
            path: edgedb-deno
        - uses: actions/setup-node@v2
        - uses: denoland/setup-deno@v1
        - name: Install deps
          run: yarn install
        - name: Get version from package.json
          id: package-version
          uses: martinbeentjes/npm-get-version-action@v1.1.0
        - name: Write version to file
          run: echo "${{ steps.package-version.outputs.current-version}}" > edgedb-deno/version.txt
        - name: Compile for Deno
          run: deno run --unstable --allow-env --allow-read --allow-write tools/compileForDeno.ts
        - name: Push to edgedb-deno
          run: cd edgedb-deno && git add . -f && git commit -m "Build from $GITHUB_SHA" && git push

An additional workflow inside ``edgedb-deno`` then creates a GitHub release, which publishes a new version to ``deno.land/x``. That's left as an exercise for the reader, though you can use `our workflow <https://github.com/edgedb/edgedb-deno/blob/main/.github/workflows/release.yml>`_ as a starting point.

Wrapping up
-----------

This is a broadly generalizable pattern for converting an existing Node.js module to Deno. Refer to the ``edgedb-js`` repo for the full `Deno compilation script <https://github.com/edgedb/edgedb-js/blob/master/tools/compileForDeno.ts>`_, `cross- workflow <https://github.com/edgedb/edgedb-js/blob/master/.github/workflows/deno-release.yml>`_.

.. pull-quote::

  Thanks to `@colinhacks <https://twitter.com/colinhacks>`_ for additional editing on this post.
