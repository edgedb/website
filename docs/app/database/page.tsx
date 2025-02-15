import { Main } from "@/components/layout";
import { Code } from "@edgedb-site/shared/components/code";
import { CodeTabs } from "@edgedb-site/shared/components/code/tabs";
import { DocsLink } from "@/dataSources/validateLink";
import {
  stdLibCodeBlocks,
  adminLinks,
  queryingLinks,
  schemaLinks,
} from "./content";
import LinksCard from "@/components/linksCard";
import styles from "../docs.module.scss";

export default function DatabasePage() {
  return (
    <Main className={styles.indexPage}>
      <h1>Database</h1>
      <p>
        Learn three components, and you know EdgeDB: how to work with{" "}
        <DocsLink href="/database/datamodel">schema</DocsLink>, how to write
        queries with <DocsLink href="/database/edgeql">EdgeQL</DocsLink>, and
        what's available to you in our{" "}
        <DocsLink href="/database/stdlib">standard library</DocsLink>. Start in
        those sections if you're new to EdgeDB. Move over to our{" "}
        <DocsLink href="/database/reference">reference</DocsLink> when you're
        ready to dive deep into the internals, syntax, and other advanced
        topics.
      </p>
      <section>
        <h2>Schema</h2>
        <p>
          EdgeDB schemas are declared using our schema definition language
          (SDL).
        </p>
        <Code
          language="sdl"
          code={`module default {
  type Book {
    required title: str;
    release_year: int16;
    author: Person;
  }
  type Person {
    required name: str;
  }
}`}
          className={styles.code}
        />
        <p>
          The example schema above defines two types: Book and Person, each with
          a property or two. Book also contains a link to the author, which is a
          link to objects of the Person type. Learn more about how to define
          your schema using SDL in the{" "}
          <DocsLink href="/database/datamodel">Schema</DocsLink> section.
        </p>
      </section>
      <section>
        <h2>EdgeQL</h2>
        <p>
          EdgeQL is a next-generation query language designed to match SQL in
          power and surpass it in terms of clarity, brevity, and intuitiveness.
        </p>
        <Code
          language="edgeql-repl"
          code={`db> select Book {
...   title,
...   release_year,
...   author: {
...     name
...   }
... } order by .title;
{
  default::Book {
    title: '1984',
    release_year: 1949,
    author: default::Person {
      name: 'George Orwell'
    }
  },
  default::Book {
    title: 'Americanah',
    release_year: 2013,
    author: default::Person {
      name: 'Chimamanda Ngozi Adichie'
    }
  },`}
          className={styles.code}
        />
        <p>
          You can use EdgeQL to easily return nested data structures just by
          putting a shape with a link on an object as shown above.
        </p>
      </section>
      <h2>Standard library</h2>
      <p>
        EdgeDB comes with a rigorously defined type system consisting of scalar
        types, collection types (like arrays and tuples), and object types. It
        also includes a library of built-in functions and operators for working
        with each datatype, alongside some additional utilities and extensions.
      </p>
      <CodeTabs tabs={stdLibCodeBlocks} className={styles.code} />
      <p>
        EdgeDB comes with a rigorously defined type system consisting of scalar
        types, collection types (like arrays and tuples), and object types. It
        also includes a library of built-in functions and operators for working
        with each datatype, alongside some additional utilities and extensions.
      </p>
      <section className={styles.sectionCheatSheets}>
        <h2>Cheatsheets</h2>
        <p>
          Learn to do various common tasks using the many tools included with
          EdgeDB.
        </p>
        <LinksCard links={queryingLinks} title="Querying" />
        <LinksCard links={schemaLinks} title="Schema" />
        <LinksCard links={adminLinks} title="Admin" />
      </section>
    </Main>
  );
}
