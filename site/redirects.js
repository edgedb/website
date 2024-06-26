module.exports = [
  // short links
  {
    source: "/p/rc3-upgrade",
    destination: "/blog/edgedb-release-candidate-3#upgrading",
    permanent: true,
  },
  {
    source: "/p/discord",
    destination: "https://discord.gg/umUueND6ag",
    permanent: true,
  },
  {
    source: "/p/bare_ddl",
    destination: "https://github.com/edgedb/edgedb-cli/pull/641",
    permanent: true,
  },
  {
    source: "/p/cloud-waitlist",
    destination:
      "https://us11.list-manage.com/survey?u=8cbb7190e54ccb8a0b344738c&id=f5a576bc8c",
    permanent: true,
  },
  {
    source: "/p/cloud-support",
    destination: "https://share.hsforms.com/1c7GIMrIqRwajMvKmF7m7mAnr2w6",
    permanent: false,
  },
  {
    source: "/p/auth-ext-docs",
    destination: "https://docs.edgedb.com/guides/auth",
    permanent: false,
  },
  {
    source: "/p/ai-ext-docs",
    destination: "https://docs.edgedb.com/guides/ai",
    permanent: false,
  },
  // blog
  {
    source: "/blog/defining-graph-relational",
    destination: "/blog/the-graph-relational-database-defined",
    permanent: true,
  },
  {
    source: "/blog/how-slow-are-orms-really",
    destination: "/blog/why-orms-are-slow-and-getting-slower",
    permanent: true,
  },
  {
    source: "/blog/everyone-is-wrong-about-orms",
    destination: "/blog/a-solution-to-the-sql-vs-orm-dilemma",
    permanent: true,
  },
  // misc
  {
    source: "/index",
    destination: "/",
    permanent: true,
  },
  {
    source: "/download",
    destination: "/install",
    permanent: true,
  },
  {
    source: "/easy-edgedb/:chapter/index",
    destination: "/easy-edgedb/:chapter",
    permanent: true,
  },
  // docs
  {
    source: "/docs/datamodel/scalars/:page",
    destination: "/docs/datamodel/primitives",
    permanent: true,
  },
  {
    source: "/docs/datamodel/objects/:path",
    destination: "/docs/datamodel/objects",
    permanent: true,
  },
  {
    source: "/docs/datamodel/computables",
    destination: "/docs/datamodel/computeds",
    permanent: true,
  },
  {
    source: "/docs/edgeql/expressions/overview",
    destination: "/docs/edgeql/index",
    permanent: true,
  },
  {
    source: "/docs/edgeql/expressions/shapes",
    destination: "/docs/edgeql/select#shapes",
    permanent: true,
  },
  {
    source: "/docs/edgeql/expressions/index",
    destination: "/docs/edgeql/literals",
    permanent: true,
  },
  {
    source: "/docs/edgeql/expressions/paths",
    destination: "/docs/edgeql/paths",
    permanent: true,
  },
  {
    source: "/docs/edgeql/expressions/operators",
    destination: "/docs/edgeql/literals",
    permanent: true,
  },
  {
    source: "/docs/edgeql/expressions/functions",
    destination: "/docs/reference/edgeql/functions",
    permanent: true,
  },
  {
    source: "/docs/edgeql/funcops/:page",
    destination: "/docs/stdlib/:page",
    permanent: true,
  },
  {
    source: "/docs/edgeql/funcops",
    destination: "/docs/stdlib/index",
    permanent: true,
  },
  {
    source: "/docs/edgeql/expressions/tuples",
    destination: "/docs/edgeql/literals#tuples",
    permanent: true,
  },
  {
    source: "/docs/edgeql/expressions/arrays",
    destination: "/docs/edgeql/literals#arrays",
    permanent: true,
  },
  {
    source: "/docs/edgeql/expressions/paths",
    destination: "/docs/edgeql/paths",
    permanent: true,
  },
  {
    source: "/docs/edgeql/expressions/parameters",
    destination: "/docs/edgeql/parameters",
    permanent: true,
  },
  {
    source: "/docs/edgeql/concepts",
    destination: "/docs/edgeql/index",
    permanent: true,
  },
  {
    source: "/docs/edgeql/commands/index",
    destination: "/docs/reference/edgeql/index",
    permanent: true,
  },
  {
    source: "/docs/edgeql/commands/select",
    destination: "/docs/edgeql/select",
    permanent: true,
  },
  {
    source: "/docs/edgeql/commands/update",
    destination: "/docs/edgeql/update",
    permanent: true,
  },
  {
    source: "/docs/edgeql/commands/insert",
    destination: "/docs/edgeql/insert",
    permanent: true,
  },
  {
    source: "/docs/edgeql/commands/delete",
    destination: "/docs/edgeql/delete",
    permanent: true,
  },
  {
    source: "/docs/edgeql/commands/for",
    destination: "/docs/edgeql/for",
    permanent: true,
  },
  {
    source: "/docs/edgeql/commands/with",
    destination: "/docs/edgeql/with",
    permanent: true,
  },
  {
    source: "/docs/edgeql/commands/:cmd",
    destination: "/docs/reference/edgeql/:cmd",
    permanent: true,
  },
  {
    source: "/docs/edgeql/admin/:cmd",
    destination: "/docs/reference/admin/:cmd",
    permanent: true,
  },
  {
    source: "/docs/edgeql/ddl/:cmd",
    destination: "/docs/reference/ddl/:cmd",
    permanent: true,
  },
  {
    source: "/docs/edgeql/sdl/:cmd",
    destination: "/docs/reference/sdl/:cmd",
    permanent: true,
  },
  {
    source: "/docs/edgeql/introspection/:page",
    destination: "/docs/guides/introspection/:page",
    permanent: true,
  },
  {
    source: "/docs/edgeql/lexical",
    destination: "/docs/reference/edgeql/lexical",
    permanent: true,
  },
  {
    source: "/docs/edgeql/eval",
    destination: "/docs/reference/edgeql/eval",
    permanent: true,
  },
  {
    source: "/docs/guides/configuration",
    destination: "/docs/reference/configuration",
    permanent: true,
  },
  {
    source: "/docs/internals/protocol/overview",
    destination: "/docs/reference/protocol/index",
    permanent: true,
  },
  {
    source: "/docs/internals/:path*",
    destination: "/docs/reference/:path*",
    permanent: true,
  },
  {
    source: "/docs/stdlib/casts",
    destination: "/docs/reference/edgeql/casts",
    permanent: true,
  },
  {
    source: "/docs/cookbook/links",
    destination: "/docs/edgeql/select",
    permanent: true,
  },
  {
    source: "/docs/:path*/props",
    destination: "/docs/:path*/properties",
    permanent: true,
  },
  {
    source: "/docs/:path*/numerics",
    destination: "/docs/:path*/properties",
    permanent: true,
  },
  {
    source: "/docs/datamodel/colltypes",
    destination: "/docs/datamodel/primitives",
    permanent: true,
  },
  {
    source: "/docs/datamodel/linkprops",
    destination: "/docs/datamodel/links#link-properties",
    permanent: true,
  },
  {
    source: "/docs/datamodel/scalars",
    destination: "/docs/datamodel/primitives",
    permanent: true,
  },
  {
    source: "/docs/datamodel/typesystem",
    destination: "/docs/datamodel/primitives",
    permanent: true,
  },
  {
    source: "/docs/cheatsheet/:page",
    destination: "/docs/guides/cheatsheet/:page",
    permanent: true,
  },
  {
    source: "/docs/edgeql/statements/:page",
    destination: "/docs/reference/edgeql/:page",
    permanent: true,
  },
  {
    source: "/docs/quickstart",
    destination: "/docs/guides/quickstart",
    permanent: true,
  },
  {
    source: "/docs/guides/cheatsheet/linkprop",
    destination: "/docs/guides/link_properties",
    permanent: true,
  },
  {
    source: "/docs/admin/:page",
    destination: "/docs/guides/:page",
    permanent: true,
  },
  {
    source: "/docs/clients/01_js/installation",
    destination: "/docs/clients/01_js/index",
    permanent: true,
  },
  {
    source: "/docs/clients/01_js/usage",
    destination: "/docs/clients/01_js/driver",
    permanent: true,
  },
  {
    source: "/docs/clients/01_js/typescript",
    destination: "/docs/clients/01_js/generation",
    permanent: true,
  },
  {
    source: "/docs/clients/01_js/api/connection",
    destination: "/docs/clients/01_js/reference",
    permanent: true,
  },
  {
    source: "/docs/clients/01_js/api/types",
    destination: "/docs/clients/01_js/reference",
    permanent: true,
  },
  {
    source: "/docs/clients/00_python/api/blocking_con",
    destination: "/docs/clients/00_python/api/blocking_client",
    permanent: true,
  },
  {
    source: "/docs/clients/00_python/api/asyncio_con",
    destination: "/docs/clients/00_python/api/asyncio_client",
    permanent: true,
  },
  {
    source: "/docs/cheatsheet/graphql",
    destination: "/docs/graphql/cheatsheet",
    permanent: true,
  },
  {
    source: "/docs/reference/dev",
    destination: "/docs/guides/contributing",
    permanent: true,
  },
  {
    source: "/docs/graphql/protocol",
    destination: "/docs/graphql/index#the-protocol",
    permanent: true,
  },
  {
    source: "/docs/graphql/limitations",
    destination: "/docs/graphql/index#known-limitations",
    permanent: true,
  },
  {
    source: "/docs/index",
    destination: "/docs",
    permanent: true,
  },
  {
    source: "/docs/clients/01_js/expressions",
    destination: "/docs/clients/01_js/querybuilder#expressions",
    permanent: true,
  },
  {
    source: "/docs/datamodel/ols",
    destination: "/docs/datamodel/access_policies",
    permanent: true,
  },
  {
    source: "/docs/reference/sdl/access_policy",
    destination: "/docs/reference/sdl/access_policies",
    permanent: true,
  },
  {
    source: "/docs/reference/ddl/access_policy",
    destination: "/docs/reference/ddl/access_policies",
    permanent: true,
  },
  {
    source: "/docs/clients/00_python/:page*",
    destination: "/docs/clients/python/:page*",
    permanent: true,
  },
  {
    source: "/docs/clients/01_js/:page*",
    destination: "/docs/clients/js/:page*",
    permanent: true,
  },
  {
    source: "/docs/clients/02_go/:page*",
    destination: "/docs/clients/go/:page*",
    permanent: true,
  },
  {
    source: "/docs/clients/90_edgeql/:page*",
    destination: "/docs/clients/http/:page*",
    permanent: true,
  },
  {
    source: "/docs/datamodel/terminology",
    destination: "/docs/datamodel/index#terminology",
    permanent: true,
  },
  {
    source: "/docs/datamodel/modules",
    destination: "/docs/datamodel/index#ref-datamodel-modules",
    permanent: true,
  },
  {
    source: "/docs/clients/js/migration_2_x",
    destination: "https://github.com/edgedb/edgedb-js/releases/tag/v0.21.0",
    permanent: true,
  },
  {
    source: "/docs/datamodel/primer",
    destination: "/docs/intro/schema",
    permanent: true,
  },
  {
    source: "/docs/edgeql/primer",
    destination: "/docs/intro/edgeql",
    permanent: true,
  },
  {
    source: "/docs/guides/quickstart",
    destination: "/docs/intro/quickstart",
    permanent: true,
  },
  {
    source: "/docs/guides/installation",
    destination: "/docs/intro/cli",
    permanent: true,
  },
  {
    source: "/docs/guides/projects",
    destination: "/docs/intro/projects",
    permanent: true,
  },
  {
    source: "/docs/guides/relations",
    destination: "/docs/datamodel/links#modeling-relations",
    permanent: true,
  },
  {
    source: "/docs/guides/link_properties",
    destination: "/docs/guides/cheatsheet/link_properties",
    permanent: true,
  },
  {
    source: "/docs/intro/index",
    destination: "/docs",
    permanent: true,
  },
  {
    source: "/docs/graphql/:page*",
    destination: "/docs/clients/graphql/:page*",
    permanent: true,
  },
  {
    source: "/docs/guides/introspection/:page*",
    destination: "/docs/datamodel/introspection/:page*",
    permanent: true,
  },
  {
    source:
      "/docs/guides/migrations/(names|backlink|proptype|proptolink|reqlink|recovering)",
    destination: "/docs/guides/migrations/tips",
    permanent: true,
  },
  // redirect to new docs site
  {
    source: "/docs/intro/:path*",
    destination: "/docs/get-started/:path*",
    permanent: true,
  },
  {
    source: "/docs/get-started",
    destination: "/docs",
    permanent: true,
  },
  {
    source: "/docs/guides/cloud/:path*",
    destination: "/docs/cloud/:path*",
    permanent: true,
  },
  {
    source: "/docs/clients/:path*",
    destination: "/docs/libraries/:path*",
    permanent: true,
  },
  {
    source: "/docs/:path((?:datamodel|edgeql|stdlib|reference)(?:/.*)?)",
    destination: "/docs/database/:path",
    permanent: true,
  },
  {
    source: "/docs/:path*/index",
    destination: "/docs/:path*",
    permanent: true,
  },
  {
    source: "/docs/:path*",
    destination: "https://docs.edgedb.com/:path*",
    permanent: true,
  },
  {
    source: "/:path((?:tutorial|easy-edgedb)(?:/.*)?)",
    destination: "https://docs.edgedb.com/:path",
    permanent: true,
  },
];
