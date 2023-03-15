import React from "react";
import Link from "next/link";

import cn from "@/utils/classNames";

import MainLayout from "@/components/layouts/main";
import LearnCards from "@/components/learnCards";

import styles from "@/styles/showcase.module.scss";
import MetaTags from "@/components/metatags";
import {Code} from "@/components/code";
import DecoratedSection, {
  DECORATION_TYPES,
} from "@/components/decoratedSection";

import Migrations from "@/components/homepage/migrations";
import WebGLWrapper from "@/components/homepage/webgl";
import {
  BackgroundBlock,
  BackgroundFader,
} from "@/components/homepage/backgroundFader";
import {learnCardsExtended, URLS} from "../../dataSources/data";

export default function MigrationsPage() {
  return (
    <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
      <MetaTags
        title="Migrations"
        description={`EdgeDB includes a database-native migration system. Modify your schema, interactively generate migrations, and confidently apply them across environments.`}
        relPath={URLS.MIGRATIONS}
      />
      <WebGLWrapper>
        <BackgroundFader usePageBackground>
          <div className="globalPageWrapper">
            <div className={styles.content}>
              <BackgroundBlock colour="ffffff" particleColour="f1f1f1">
                <h1>Migrations</h1>
                <div className={styles.intro}>
                  <p>
                    EdgeDB's baked-in migration system lets you painlessly
                    evolve your schema throughout the development process.
                  </p>
                  <p>
                    Whereas other migration tools redundantly store copies of
                    your schema in opaque files or create additional tables to
                    track migration history, every EdgeDB instance
                    automatically tracks its own migration history in a fully
                    introspectable way. Plus, all migration logic is generated
                    by the database instance itself.
                  </p>
                </div>
              </BackgroundBlock>
            </div>
          </div>
          <BackgroundFader className={styles.darkSection} data-theme="dark">
            <BackgroundBlock colour="2c1428">
              <div className="globalPageWrapper">
                <div className={styles.content}>
                  <h3 className={styles.light}>Features</h3>
                  <div className={styles.sectionBody}>
                    <DecoratedSection
                      decorationText={"01"}
                      title={"Declarative"}
                    >
                      <p>
                        Your database schema is defined in a <code>.esdl</code>{" "}
                        file using EdgeDB's readable, elegant schema definition
                        language. This file is the single source of truth for
                        your schema; just update it directly as your
                        application evolves. EdgeDB's migration system handles
                        the rest.
                      </p>
                    </DecoratedSection>
                    <DecoratedSection
                      decorationText={"02"}
                      title={"Database-native"}
                    >
                      <p>
                        When you create a migration with EdgeDB, the migration
                        logic is generated <em>by your database</em>. The CLI
                        simply sends your schema (as defined in your{" "}
                        <code>.esdl</code> file) to your EdgeDB instance, which
                        compares it against its current internal schema state,
                        detects any changes, and generates a migration plan.
                      </p>
                    </DecoratedSection>
                    <DecoratedSection
                      decorationText={"03"}
                      title={"Interactive and inspectable"}
                    >
                      <p>
                        The process of creating a migration is a conversation
                        between you and your database. Each detected schema
                        change is presented to you for approval, so you know
                        exactly what the migration will do. Plus, you'll be
                        automatically prompted to resolve any ambiguities, like
                        specifying the default value for a new required
                        property.
                      </p>
                    </DecoratedSection>
                    <DecoratedSection
                      decorationText={"04"}
                      title={"Deterministic"}
                    >
                      <p>
                        The same series of migrations will always produce the
                        same final schema when applied to a database. By
                        sharing a common migration history among your
                        development, staging, and production databases, you can
                        apply migrations with confidence.
                      </p>
                    </DecoratedSection>

                    <DecoratedSection
                      decorationText={"05"}
                      title={"CI/CD Friendly"}
                    >
                      <p>
                        After generating a set of migrations against your
                        development database, you can confidently apply those
                        migrations to your staging and production instances in
                        your continuous integration pipeline. The{" "}
                        <code>edgedb migrate</code> command is is fully
                        idempotent; previously-applied migrations won’t be
                        applied again, so it’s safe to run this command in
                        automated workflows.
                      </p>
                    </DecoratedSection>

                    <DecoratedSection
                      decorationText={"06"}
                      title={"Non-duplicative"}
                    >
                      <p>
                        Other migration tools redundantly store snapshots of
                        your schema in migration files or create extra tables
                        in your database to track migrations. Not EdgeDB.
                        EdgeDB instances automatically track their own
                        migration history in a fully introspectable way,
                        avoiding thorny schema drift issues common with other
                        tools.
                      </p>
                    </DecoratedSection>
                  </div>
                </div>
              </div>
            </BackgroundBlock>
          </BackgroundFader>
          <BackgroundBlock colour="ffffff" particleColour="f1f1f1">
            <div className="globalPageWrapper">
              <div className={styles.content}>
                <h3>Workflow</h3>
                <Migrations className={styles.migrationsCode} />
                <div className={styles.narrowSection}>
                  <h4>And now step by step</h4>
                  <DecoratedSection
                    decorationType={DECORATION_TYPES.BEFORE}
                    decorationText={"/01"}
                    title="Update your schema file"
                    classes={styles.stepByStepSection}
                  >
                    <p>
                      In EdgeDB, your application schema is declaratively
                      defined using EdgeDB's SDL. To learn more about schemas
                      modeling in EdgeDB, check out the{" "}
                      <Link href={URLS.DATA_MODELING}>Data Modeling</Link>{" "}
                      showcase page.
                    </p>
                  </DecoratedSection>
                  <div className={cn(styles.exampleCode, styles.code)}>
                    <Code
                      language={"sdl"}
                      code={`type User {
  required property name -> str;
}

type Post {
  required property title -> str;
  required link author -> User;
}`}
                    ></Code>
                  </div>
                  <p>
                    By convention, this schema lives inside of{" "}
                    <code>.esdl</code> files inside the <code>dbschema</code>{" "}
                    directory of your project. You can keep your entire schema
                    in one file (typically <code>default.esdl</code>) or split
                    it across several files. The EdgeDB CLI will automatically
                    deep-merge all declarations. Directly modify these files as
                    your application schema develops.
                  </p>
                  <div className={cn(styles.exampleCode, styles.code)}>
                    <Code
                      language="sdl-diff"
                      code={`   type User {
     required property name -> str;
   }

-  type BlogPost {
+  type Post {
-    required property title -> str;
+    property title -> str;

+    required property upvotes -> int64;

     required link author -> User;
   }

+   type Comment {
+     required property content -> str;
+   }`}
                    />
                  </div>
                  <DecoratedSection
                    decorationType={DECORATION_TYPES.BEFORE}
                    decorationText={"/02"}
                    title="Generate a migration"
                    classes={styles.stepByStepSection}
                  >
                    <p>
                      To modify your schema, make a change to your schema file
                      and run <code>edgedb migration create</code>.
                    </p>
                    <p>
                      Your schema files will be sent to the development
                      database, which will compare the files to its current
                      schema state and determine a migration plan. This plan is
                      then presented to you interactively; every detected
                      schema change will be individually presented to you for
                      approval:
                    </p>
                  </DecoratedSection>

                  <div className={cn(styles.exampleCode, styles.code)}>
                    <Code
                      language="bash"
                      code={`$ edgedb migration create
Did you rename object type 'default::BlogPost' to
'default::Post'? [y,n,l,c,b,s,q,?]
>y

Did you create object type 'default::Comment'?
[y,n,l,c,b,s,q,?]
>y

Did you make property 'title' of object type
'default::Post' optional? [y,n,l,c,b,s,q,?]
>y

Did you create property 'upvotes' of object type
'default::Post'? [y,n,l,c,b,s,q,?]
>y

Please specify an expression to populate existing
objects in order to make property 'upvotes' of
object type 'default::Post' required:
fill_expr> 0
Created ./dbschema/migrations/00002.edgeql,
id: m16f7cbc...`}
                    ></Code>
                  </div>
                  <p>
                    As you can see, you are presented with an exhaustive list
                    of the detected schema changes. This is a useful sanity
                    check, and it provides a level of visibility into the
                    migration process that is sorely lacking from most
                    migration tools.
                  </p>
                  <p>
                    For each of these prompts, you have a variety of commands
                    at your disposal. Type <code>?</code> into the prompt for
                    an explanation of these options.
                  </p>
                  <div className={cn(styles.exampleCode, styles.code)}>
                    <Code
                      language="bash"
                      code={`$ edgedb migration create
Did you create property X...? [y,n,l,c,b,s,q,?]
>?

y - confirm the prompt, use the DDL statements
n - reject the prompt
l - list the DDL statements associated with prompt
c - list already confirmed EdgeQL statements
b - revert back to previous save point, perhaps previous question
s - stop and save changes (splits migration into multiple)
q - quit without saving changes
h or ? - print help`}
                    ></Code>
                  </div>
                  <p>
                    The process of creating migrations is truly interactive.
                    You can go back to previous prompts, split the schema
                    changes into several individual migrations, or inspect the
                    associated DDL commands (e.g. <code>CREATE TYPE</code>,
                    etc).
                  </p>
                  <p>
                    Remember, <code>migration create</code> simply generates a
                    migration script, it doesn't apply it! So you can safely
                    quit at any time with <code>q</code> or
                    <code>Ctrl/Cmd-C</code> without worrying about leaving your
                    schema in an inconsistent state.
                  </p>
                  <p>
                    Once you’ve completed the prompts, the CLI will generate a
                    <code>.edgeql</code> file representing the migration inside
                    your <code>dbschema/migrations</code> directory.
                  </p>
                  <DecoratedSection
                    decorationType={DECORATION_TYPES.BEFORE}
                    decorationText={"/03"}
                    title="Apply the migration"
                    classes={styles.stepByStepSection}
                  >
                    <p>
                      Just run <code>edgedb migrate</code> to apply all
                      unapplied migrations.
                    </p>
                  </DecoratedSection>

                  <div className={cn(styles.exampleCode, styles.code)}>
                    <Code
                      language="bash"
                      code={`$ edgedb migrate
Applied m1virjowa... (00001.edgeql)
`}
                    ></Code>
                  </div>
                  <p>
                    That's it! Now you know how to migrate an EdgeDB schema. To
                    learn how migrations work in greater detail, check out the{" "}
                    <Link href="/docs/cli/edgedb_migration">
                      CLI reference
                    </Link>
                    , the{" "}
                    <Link href="https://github.com/edgedb/rfcs/blob/master/text/1000-migrations.rst">
                      original RFC
                    </Link>
                    , or the{" "}
                    <Link href="/blog/edgedb-1-0-beta-1-sirius#built-in-database-migrations-in-use">
                      Beta 1 release post
                    </Link>
                    , which describes the design of the migration system.
                  </p>
                </div>
              </div>
            </div>
            <div className="globalPageWrapper">
              <div className={styles.content}>
                <h2>Keep exploring</h2>
                <LearnCards
                  cards={learnCardsExtended.filter(
                    (card) => card.href !== URLS.MIGRATIONS
                  )}
                />
              </div>
            </div>
          </BackgroundBlock>
        </BackgroundFader>
      </WebGLWrapper>
    </MainLayout>
  );
}

{
  /* <WebGLModel modelId="cloud" className={styles.cloudModel} /> */
}
