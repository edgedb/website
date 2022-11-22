import {Fragment} from "react";
import Head from "next/head";
import Link from "next/link";

import cn from "@/utils/classNames";

import MainLayout from "@/components/layouts/main";
import {Code} from "@/components/code";
import ToC from "@/components/toc";

import {sections} from "content/roadmap";
import {CodeBlock, RoadmapItem} from "content/roadmap/interfaces";

import styles from "@/styles/roadmap.module.scss";
import MetaTags from "@/components/metatags";

const titleToId = (title: string) => title.toLowerCase().replace(/\s+/g, "-");

const sectionHeaders = [
  {id: "design-principles", title: "Design Principles"},
  ...sections.map(({title}) => ({
    id: titleToId(title),
    title,
  })),
];

export default function RoadmapPage() {
  return (
    <MainLayout className={styles.page}>
      <MetaTags
        title="Roadmap"
        description={`See what's already implemented and what's coming down the pike.`}
        relPath="/roadmap"
      />
      <div className={styles.pageWrapper}>
        <div className="globalPageWrapper">
          <div className={styles.sidenav}>
            <ToC
              headers={sectionHeaders}
              sectionSelector={`.${styles.section}`}
              rightAlign
            />
          </div>
        </div>
        <div>
          <div className="globalPageWrapper">
            <div className={styles.content}>
              <div className={styles.roadmapIllustration} />
              <h1>Roadmap</h1>

              <p className={styles.intro}>
                Our mission is to empower developers with a database to build
                software <b>faster</b> and with <b>less effort</b>.
              </p>
              <p className={styles.subIntro}>
                See what is already implemented as well as of what to expect in
                the future.
              </p>

              <div
                className={styles.section}
                data-section-id="design-principles"
              >
                <h2 id="design-principles">Design Principles</h2>
                <div className={styles.principlesBlock}>
                  <div>
                    <h3>Ergonomics</h3>
                    <p>
                      The data model, EdgeQL, and all aspects of EdgeDB
                      operation should be straightforward to learn and reason
                      about, and the user experience should be a satisfying
                      one.
                    </p>
                  </div>
                  <div>
                    <h3>Performance</h3>
                    <p>
                      EdgeQL features, language bindings, and tooling should be
                      designed with{" "}
                      <Link href="/blog/edgedb-1-0-alpha-1#benchmarks">
                        <a>high performance</a>
                      </Link>
                      , low latency operation in mind.
                    </p>
                  </div>
                  <div>
                    <h3>Correctness</h3>
                    <p>
                      Correctness should never be sacrificed in favor of
                      ergonomics or performance. Nonsensical operations must
                      always generate an error.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {sections.map((section, i) => (
            <div
              className={cn(styles.section, styles.striped)}
              key={i}
              data-section-id={titleToId(section.title)}
            >
              <div className="globalPageWrapper">
                <div className={styles.content}>
                  <h2 id={titleToId(section.title)}>{section.title}</h2>
                  {section.intro ? (
                    <div className={styles.sectionIntro}>{section.intro}</div>
                  ) : null}
                  {section.groups.map((group, i) => (
                    <div
                      className={cn(
                        styles.sectionItemsGroup,
                        group.alignment
                          ? styles[`align-${group.alignment}`]
                          : null
                      )}
                      key={i}
                    >
                      <div className={styles.sectionItems}>
                        {group.items.map((item, i) => (
                          <Fragment key={i}>
                            {RoadmapItemRenderer(item)}
                          </Fragment>
                        ))}
                      </div>
                      {group.codeblocks ? (
                        <div className={styles.sectionCodeblocks}>
                          {group.codeblocks.map((codeblock, i) => (
                            <Fragment key={i}>
                              {CodeBlockRenderer(codeblock)}
                            </Fragment>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

const badgeNames: {
  [key: string]: string;
} = {
  partly: "partly done",
  planned: "planned for",
  inprogress: "in progress",
};

function RoadmapItemRenderer(item: RoadmapItem) {
  const [badgeType, badgeVersion] = item.badge.split("-");

  return (
    <div className={styles.sectionItem}>
      <h3>
        <span>{item.title}</span>
        <span className={cn(styles.badge, styles[badgeType])}>
          {badgeNames[badgeType] ?? badgeType}
          {badgeVersion ? " " + badgeVersion : ""}
        </span>
      </h3>
      {item.content}
    </div>
  );
}

function CodeBlockRenderer(codeblocks: CodeBlock | CodeBlock[]) {
  const blocks = (Array.isArray(codeblocks) ? codeblocks : [codeblocks]).map(
    ({language, code}) => {
      const lines = code.split("\n");

      if (lines[0].trim().length === 0) {
        const removeChars = lines[1].length - lines[1].trimStart().length;
        code = lines
          .slice(1)
          .map((line) => line.slice(removeChars))
          .join("\n");
      }

      return {
        language,
        code,
      };
    }
  );

  const isTerminal = blocks.some(
    ({language}) => language === "bash" || language.includes("repl")
  );

  return (
    <div
      className={cn(styles.codeBlock, {
        [styles.terminal]: isTerminal,
      })}
      data-theme={isTerminal ? "dark" : "light"}
    >
      <div className={styles.codeBlockInner}>
        {blocks.map((block, i) => (
          <Code {...block} noCopy key={i} />
        ))}
      </div>
    </div>
  );
}
