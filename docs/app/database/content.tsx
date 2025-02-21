import { Code } from "@edgedb-site/shared/components/code";
import { CodeTab } from "@edgedb-site/shared/components/code/tabs";

export const stdLibCodeBlocks: CodeTab[] = [
  {
    name: "Scalar Types",
    lang: "bash",
    kind: "code",
    codeBlock: (
      <Code
        language="edgeql-repl"
        code={`db> select count(Book);
{16}
db> select Book {
...   title,
...   title_length := len(.title)
... } order by .title_length;
{
  default::Book {
    title: 'Sula',
    title_length: 4
  },
  default::Book {
    title: '1984',
    title_length: 4
  },
  default::Book {
    title: 'Beloved',
    title_length: 7
  },
  default::Book {
    title: 'The Fellowship of the Ring',
    title_length: 26
  },
  default::Book {
    title: 'One Hundred Years of Solitude',
    title_length: 29
  },
}
db> select math::stddev(len(Book.title));
{7.298401651503339}
`}
      />
    ),
  },
];

export const queryingLinks = [
  { title: "select", url: "/database/cheatsheets/select" },
  { title: "insert", url: "/database/cheatsheets/insert" },
  { title: "update", url: "/database/cheatsheets/update" },
  { title: "delete", url: "/database/cheatsheets/delete" },
  { title: "via GraphQL", url: "/libraries/graphql/cheatsheet" },
];

export const schemaLinks = [
  { title: "Booleans", url: "/database/cheatsheets/boolean" },
  { title: "Object Types", url: "/database/cheatsheets/objects" },
  { title: "Functions", url: "/database/cheatsheets/functions" },
  { title: "Aliases", url: "/database/cheatsheets/aliases" },
  { title: "Annotations", url: "/database/cheatsheets/annotations" },
  { title: "Link Properties", url: "/database/cheatsheets/link_properties" },
];

export const adminLinks = [
  { title: "CLI", url: "/database/cheatsheets/cli" },
  { title: "REPL", url: "/database/cheatsheets/repl" },
  { title: "Admin", url: "/database/cheatsheets/admin" },
];
