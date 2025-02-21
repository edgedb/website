import React, {
  useRef,
  PropsWithChildren,
} from "react";

import Link from "next/link";
import MainLayout from "@/components/layouts/main";
import PageHeader, {PageHeaderSpacer} from "@/components/pageNav";
import {NavCloud} from "@/components/pageNav/logo";
import MetaTags from "@/components/metatags";
import cn from "@edgedb/common/utils/classNames";
import {
  AuthFormSvg,
  OauthAppleIcon,
  OauthDiscordIcon,
  OauthGithubIcon,
  OauthSlackIcon,
  OauthMicrosoftIcon,
  OauthGoogleIcon,
  Anthropic,
  OpenAi,
  Mistral,
} from "@/components/icons";
import Three from "@/components/index/env";
import Iceberg from "@/components/index/iceberg";
import Bubble from "@/components/index/bubble";
import VersusTabs from "@/components/index/versus";
import BenchmarkChart from "@/components/benchmarkChart";
import styles from "@/styles/index.module.scss";
import {Code} from "@edgedb-site/shared/components/code";
import {useWebgl} from "@edgedb-site/shared/utils/hasWebgl";
import getCloudLoginUrl, {Tiers} from "@edgedb-site/shared/utils/getLoginUrl";

const IndexPage = () => {
  const hasWebgl = useWebgl();

  return (
    <MainLayout skipPageHeader={true} className={styles.page}>
      <MetaTags
        title="EdgeDB | The next-gen database"
        siteTitle={null}
        description={`EdgeDB is an open-source database designed to address ergonomic limitations of SQL and relational modeling, without sacrificing type safety or performance.`}
        relPath=""
        imagePath="/logos/tw_card_intro.png"
      />
      <div>
        <Three />
        <div className={styles.firstScroll}>
          <PageHeader />
          {/*<Announcement href="/blog/seamless-dx-with-vercel">
            New Vercel integration has just launched!
          </Announcement>*/}
          <div className={styles.splash}>
            <div className={styles.center}>
              <div className={styles.headers}>
                <h1 className={styles.highlight}>Turbocharged Postgres</h1>
                <h1>data layer</h1>
              </div>
              <p>
                We wanted a database with hierarchical queries, advanced data
                modeling, and great DX. There were none, so we built EdgeDB,
                based on PostgreSQL, 100% <a href="https://github.com/edgedb/edgedb">open source</a>.
              </p>
              <p>It's become so much more.</p>
              <div className={styles.buttons}>
              <Link className={cn(styles.button, styles.empty)}
                      href="https://docs.edgedb.com/get-started/quickstart">
                  Docs
                </Link>
                <Link
                  className={styles.button}
                  href={getCloudLoginUrl(Tiers.free)}
                >
                  <NavCloud />
                  <span>Sign Up!</span>
                </Link>
              </div>
            </div>
          </div>
          <PageHeaderSpacer><Explore/></PageHeaderSpacer>
        </div>

        <div className={cn(styles.section, styles.versus)}>
          <div className={styles.sectionHead}>
            <h2>N+1, solved</h2>
            <p>EdgeDB solves the problems that ORMs exist to workaround.</p>
            <p>A comparison that speaks for itself:</p>
          </div>

          <VersusTabs />

          <div className={styles.cols}>
            <div className={styles.col}>
              <h4>Composable</h4>
              <p>Write complex queries at the speed of thought.</p>
            </div>
            <div className={styles.col}>
              <h4>Ergonomic</h4>
              <p>Fully type-safe query language and schema.</p>
            </div>
            <div className={styles.col}>
              <h4>Universal</h4>
              <p>Learn once and build with any software stack.</p>
            </div>
          </div>
        </div>

        <div className={cn(styles.section, styles.benchmarkSection)}>
          <div className={styles.sectionHead}>
            <h2>Fast</h2>
            <p>
              EdgeDB's client libraries, network protocol, and query language
              are designed for performance.
            </p>
          </div>
          <BenchmarkChart
            className={styles.benchmark}
            groupLabel="DB / backend latency:"
            defaultSelected="1ms"
            data={{
              "300us": [
                {label: "EdgeDB", value: 1071, highlighted: true},
                {label: "Drizzle", value: 712},
                {label: "Sequelize", value: 389},
                {label: "SQLAlchemy", value: 292},
                {label: "Prisma", value: 284},
                {label: "Django", value: 134},
              ],
              "1ms": [
                {label: "EdgeDB", value: 605, highlighted: true},
                {label: "Drizzle", value: 310},
                {label: "Sequelize", value: 215},
                {label: "SQLAlchemy", value: 159},
                {label: "Prisma", value: 114},
                {label: "Django", value: 75},
              ],
              "10ms": [
                {label: "EdgeDB", value: 93, highlighted: true},
                {label: "Drizzle", value: 38},
                {label: "Sequelize", value: 32},
                {label: "SQLAlchemy", value: 23},
                {label: "Prisma", value: 13},
                {label: "Django", value: 11},
              ],
            }}
            axisTickSize={100}
            axisLabel="Requests per second. More is better."
          />
        </div>

        <div className={cn(styles.section, styles.say)}>
          <div className={styles.col1}>
            <Bubble title="Guillermo Rauch, Vercel, Founder & CEO" image="rauchg.jpg" x="rauchg">
              EdgeDB fixes fundamental flaws of SQL and legacy DBs in serverless. The perfect fit for Next.js and Vercel.
            </Bubble>

            <Bubble title="James Tamplin, Firebase, Founder" image="james.jpg" x="JamesTamplin">
              EdgeDB's powerful querying is what we wanted to build into Firebase and never got there. I'm excited!
            </Bubble>

            <Bubble title="David Cramer, Sentry, Founder" image="zeeg.jpg" x="zeeg">
              The most high tech companies in the world run graph architectures on top of SQL. Now you, too, can be high tech.
            </Bubble>

            <Bubble title="Charlie Marsh, Astral, Founder" image="charlie.jpg" x="charliermarsh">
              I've been continually impressed by both the ideas behind EdgeDB and the way they've been brought to life.
            </Bubble>
          </div>

          <div className={styles.col2}>
            <Bubble title="Theo - t3.gg" image="theo.jpg" x="t3dotgg">
              As a long time hater of MongoDB, I'm pumped to see a real challenger for SQL that goes the other direction. Relations are good!
            </Bubble>

            <Bubble title="Sebastián Ramírez, FastAPI" image="sebastian.jpg" x="tiangolo">
              If you want to use a relational database but you wish there was something beyond SQL, you should check out EdgeDB. As it generates strict types, has async drivers, and has great performance, it's a great DB option for FastAPI apps. And it's built by the same people that created the async Python underpinnings that enable things like FastAPI.
            </Bubble>
          </div>
        </div>

        <div className={cn(styles.section, styles.ai)}>
          <div className={styles.sectionHead}>
            <h2>AI-Ready</h2>
            <p>
              EdgeDB can automatically generate embeddings for your data.
              <br />
              Works with OpenAI, Mistral AI, and Anthropic.
            </p>
            <p>Ship AI-enabled apps in three steps.</p>
          </div>
          <div className={styles.cols}>
            <div className={styles.steps}>
              <div
                className={styles.aiStep}
                style={{"--blockOrder": 1} as any}
              >
                <p>Drop this line into your schema:</p>
                <Code
                  language="sdl"
                  code="using extension ai;"
                  noCopy
                  className={styles.codeBlock}
                />
              </div>
              <div
                className={styles.aiStep}
                style={{"--blockOrder": 2} as any}
              >
                <p>Add an AI index to your type:</p>
                <Code
                  language="sdl"
                  code={`type Astronomy {
  content: str;
  deferred index
    ext::ai::index(...) on (.content);
}`}
                  noCopy
                  className={styles.codeBlock}
                />
              </div>
              <div
                className={styles.aiStep}
                style={{"--blockOrder": 3} as any}
              >
                <p>Configure which LLM you want to use.</p>
                <div className={styles.llms}>
                  <div>
                    <Anthropic />
                  </div>
                  <div>
                    <OpenAi />
                  </div>
                  <div>
                    <Mistral />
                  </div>
                </div>
              </div>
              <div
                className={styles.aiStep}
                style={{"--blockOrder": 4} as any}
              >
                <p>
                  Query your new RAG endpoint via HTTP or our client SDKs.
                  EdgeDB will handle the rest.
                </p>
              </div>
              <div></div>
            </div>
            <div className={styles.col}>
              <div className={styles.subCol}>
                <h4>Simple Stack</h4>
                <p>
                  Store and query your application and vector data in one
                  database.
                </p>
              </div>
              <div className={styles.subCol}>
                <h4>Flexible</h4>
                <p>
                  Use the full RAG or only the deferred AI index functionality.
                </p>
              </div>
              <div className={styles.subCol}>
                <h4>Graphical UI</h4>
                <p>Chat with your database via the built-in graphical UI.</p>
              </div>
            </div>
          </div>
        </div>

        <div className={cn(styles.section, styles.auth)}>
          <div className={styles.sectionHead}>
            <h2>Seamless Auth</h2>
            <p className={styles.intro}>
              EdgeDB comes with a complete built-in auth solution.
              OAuth, passwords, passwordless, email, notifications — all covered.
            </p>
          </div>

          <div className={styles.cols}>
            <div className={cn(styles.col, styles.col1)}>
              <h4>Login UI</h4>
              <p>
                Enable the built-in login UI flow, or craft your own with our
                SDK.
              </p>
              <h4>Access Policies</h4>
              <p>
                Auth works with Schema Access Policies for robust data
                security.
              </p>
              <h4>Free</h4>
              <p>
                Included in the core with no hidden charges — support
                unlimited users.
              </p>
            </div>
            <div className={cn(styles.col, styles.col2)}>
              <AuthFormSvg />
            </div>
            <div className={cn(styles.col, styles.col3)}>
              <h4>OAUTH</h4>
              <div className={styles.oauthIcons}>
                <OauthAppleIcon />
                <OauthGithubIcon />
                <OauthGoogleIcon />
                <OauthMicrosoftIcon />
                <OauthDiscordIcon />
                <OauthSlackIcon />
              </div>
              <h4>EMAIL</h4>
              <p>
                EdgeDB sends emails for password resets, registration, and
                more.
              </p>
              <h4>Passwordless</h4>
              <p>Passkeys, WebAuthn, magic links... we've got it all.</p>
            </div>
          </div>
        </div>

        <div className={cn(styles.section, styles.cloud)}>
          <div className={styles.sectionHead}>
            <h2>Cloud</h2>
            <p className={styles.intro}>
              EdgeDB Cloud is designed alongside both EdgeDB and its tooling
              to deliver the very best cloud database experience.
            </p>
            <div className={styles.buttons}>
              <Link
                className={styles.button}
                href={getCloudLoginUrl(Tiers.free)}
              >
                Create your cloud database
              </Link>
            </div>
          </div>

          <div className={styles.gridCols}>
            <div className={styles.col}>
              <h4>Vertically integrated</h4>
              <p>EdgeDB, its core tools, SDKs, and our Cloud are designed to function cohesively.</p>
            </div>
            <div className={styles.col}>
              <h4>Admin panel</h4>
              <p>Includes performance metrics, schema browser, REPL, query IDE, and a data editor for your app.</p>
            </div>
            <div className={styles.col}>
              <h4>Secure by default</h4>
              <p>TLS is seamless and enabled by default. We handle certificates and connection strings for you.</p>
            </div>
            <div className={styles.col}>
              <h4>Vercel &amp; GitHub integration</h4>
              <p><Link href="/blog/vercel-edgedb-branches-workflow-and-hackathon-alert">Auto-configure Vercel</Link> and enable preview deployments for GitHub PRs.</p>
            </div>
            <div className={styles.col}>
              <Soon/>
              <h4>Regional replicas</h4>
              <p>Create read-only copies in various regions and route queries to the nearest replica.</p>
            </div>
            <div className={styles.col}>
              <Soon/>
              <h4>Performance insights</h4>
              <p>Slow query log, automatic EXPLAIN, and tailored optimization advice.</p>
            </div>
          </div>

          <div className={styles.image}>
            <img src="/_images/index/cloud.webp"
                 alt="A screenshot of EdgeDB Cloud dashboard" />
          </div>
        </div>

        {hasWebgl ? (
          <div className={cn(styles.section, styles.cloud)}>
            <div className={styles.sectionHead}>
              <h2>Loaded</h2>
              <p className={styles.intro}>
                EdgeDB is jam-packed with features and fresh ideas.
              </p>
            </div>

            <div className={styles.iceberg}>
              <Iceberg className={styles.icebergCnt} />
            </div>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
};

export default IndexPage;


function Soon() {
  return <div className={styles.soon}>Soon</div>
}

function Explore() {
  return <div className={styles.explore}>
    <span>Explore</span>
    <svg width="18" height="10" viewBox="0 0 18 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 1L9 9L1 1" stroke="#8280FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
}

function Announcement({href, children}: PropsWithChildren<{href: string}>) {
  return (
    <div className={styles.announcement}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.77883 0.444807L6.94549 4.6115L10.2788 7.94486L14.4455 7.11152L11.9453 4.61124L12.0712 4.48527C12.4618 4.09475 12.4618 3.46158 12.0712 3.07106L11.8188 2.81859C11.4282 2.42807 10.7951 2.42807 10.4046 2.81859L10.2786 2.94456L7.77883 0.444807ZM1.94482 9.61133L6.11152 5.44463L9.44488 8.77799L5.27818 12.9447L1.94482 9.61133ZM1.81843 12.8184C1.42791 12.4279 1.42791 11.7947 1.81843 11.4042L1.94467 11.278L3.61135 12.9447L3.48511 13.0709C3.09459 13.4614 2.46142 13.4614 2.0709 13.0709L1.81843 12.8184ZM7.77865 12.1115L6.94531 12.9448L9.02866 15.0282C9.25878 15.2583 9.63188 15.2583 9.862 15.0282C10.0921 14.7981 10.0921 14.425 9.862 14.1948L7.77865 12.1115Z"
          fill="#279474"
        />
      </svg>
      {children} <Link href={href}>Read more</Link>
    </div>
  );
}
