import {DiscordIcon} from "@/components/icons";
import MainLayout from "@/components/layouts/main";
import MetaTags from "@/components/metatags";

import cn from "@edgedb-site/shared/utils/classNames";
import {useQueryParams} from "@edgedb-site/shared/hooks/useQueryParams";

import styles from "@/styles/launch.module.scss";

const scheduleItems: {
  title: string;
  content: JSX.Element;
  speakers: string;
  company: string;
  avatarUrls: string[];
}[] = [
  {
    title: "Introducing EdgeDB 4.0",
    content: (
      <>
        <p>
          EdgeDB 4.0 introduces a plethora of enhancements and new features,
          with full-text search at the forefront. We believe it's a
          game-changer and can't wait to share why.
        </p>
      </>
    ),
    speakers: "Yury Selivanov, Michael Sullivan",
    company: "EdgeDB",
    avatarUrls: [
      getTeamAvatar("YurySelivanov"),
      getTeamAvatar("MichaelSullivan"),
    ],
  },
  {
    title: "EdgeDB Cloud Launch 🚀",
    content: (
      <>
        <p>
          EdgeDB Cloud general availability starts today. Become an
          infrastructure superhero with a cloud service that lets you
          seamlessly get your database out into the world!
        </p>
        <p>
          Whether you prefer using our CLI or the slick EdgeDB Cloud UI, you're
          going to love the experience of managing your database on EdgeDB
          Cloud.
        </p>
      </>
    ),
    speakers: "Yury Selivanov, Elvis Pranskevichus",
    company: "EdgeDB",
    avatarUrls: [
      getTeamAvatar("YurySelivanov"),
      getTeamAvatar("ElvisPranskevichus"),
    ],
  },
  {
    title: "EdgeDB Auth",
    content: (
      <>
        <p>
          Every app needs authentication, but it's a pain to build and it
          distracts you from building the parts of your app that deliver the
          value to your users.
        </p>
        <p>
          EdgeDB's new auth extension adds a full authentication service that
          runs alongside your database instance, saving you the hassle of
          having to learn and implement the intricacies of OAuth or secure
          password storage.
        </p>
      </>
    ),
    speakers: "Yury Selivanov, Scott Trinh",
    company: "EdgeDB",
    avatarUrls: [getTeamAvatar("YurySelivanov"), getTeamAvatar("ScottTrinh")],
  },
  {
    title: "Fast GraphQL with EdgeDB @ BeatGig",
    content: (
      <p>
        The musical matchmakers at BeatGig use EdgeDB in a unique and powerful
        way.
      </p>
    ),
    speakers: "Jeremy Berman",
    company: "Co-founder & CTO @ BeatGig",
    avatarUrls: [getUserAvatar("beatgig", "jeremy")],
  },
  {
    title: "AI + EdgeDB @ Credal.ai",
    content: (
      <p>
        Credal.ai builds on EdgeDB for a competitive advantage on their mission
        for More AI & Less Risk.
      </p>
    ),
    speakers: "Jack Fischer",
    company: "Co-founder @ Credal.ai",
    avatarUrls: [getUserAvatar("credal", "jack")],
  },
  {
    title: "Pushing the limits: EdgeDB ++ ReScript",
    content: (
      <p>
        Learn how advanced EdgeDB features can be used with ReScript to build a
        fully type safe frictionless developer experience.
      </p>
    ),
    speakers: "Gabriel Nordeborn",
    company: "ReScript core contributor & CTO @ Arizon",
    avatarUrls: [getUserAvatar("arizon", "gabriel")],
  },
  {
    title: "Building a data layer with EdgeDB @ Dexa",
    content: (
      <p>
        Dexa is making it possible to search through the ocean of knowledge
        shared on popular podcasts, YouTube, and beyond.
      </p>
    ),
    speakers: "Marcus Martins",
    company: "Co-founder & CTO @ Dexa.ai",
    avatarUrls: [getUserAvatar("dexa", "marcus")],
  },
];

function JoinButton({className}: {className?: string}) {
  return (
    <a
      href="/blog/edgedb-cloud-and-edgedb-4-0"
      className={cn(styles.joinButton, className)}
    >
      Read&nbsp;the&nbsp;announcement!
    </a>
  );
}

export default function LaunchPage() {
  const params = useQueryParams();
  const showPrimer = params?.has("lang");

  return (
    <MainLayout
      className={styles.page}
      // todo pageBackgroundColour={{light: "#f2f2f2"}}
      hideGlobalBanner
    >
      <MetaTags
        title="EdgeDB Developer Day"
        description={`Join us November 1, 2023, 10am PT as we launch EdgeDB 4.0 (w/ full-text search) and EdgeDB Cloud. Hear from companies building amazing things on EdgeDB.`}
        relPath="/launch"
        imagePath="/assets/launch/developer-day-share.jpg"
      />

      <div className="globalPageWrapper">
        <div className={styles.content}>
          <h1>
            EdgeDB
            <br />
            <span>Developer Day</span>
          </h1>

          <div className={styles.youtube}>
            <iframe
              src={`https://www.youtube.com/embed/r--YN_6a76g`}
              frameBorder={0}
              allowFullScreen
              // @ts-ignore
              loading="lazy"
            />
          </div>

          <JoinButton className={styles.overlapButton} />
        </div>
      </div>
      {showPrimer ? (
        <div className={styles.whiteBackground}>
          <div className="globalPageWrapper">
            <div className={styles.content}>
              <h2>What is EdgeDB?</h2>
              <div className={styles.columns}>
                <div>
                  <p>
                    EdgeDB is an open-source database designed as a
                    developer-centric successor to SQL and the relational
                    paradigm.
                  </p>
                  <p>
                    EdgeDB thinks about schema the same way developers do: as{" "}
                    <b>objects</b> with <b>properties</b> connected by{" "}
                    <b>links</b>.
                  </p>
                  <p>
                    It's like a relational database with an object-oriented
                    data model, or a graph database with strict schema.
                  </p>
                </div>
                <ul>
                  <li>
                    <b>Experience</b>: Our commitment to developer experience
                    is in everything we do, from the features we add, to our
                    CLI, to our documentation, and beyond.
                  </li>
                  <li>
                    <b>TypeScript</b>: The best database for TypeScript with
                    our{" "}
                    <a href="/blog/designing-the-ultimate-typescript-query-builder">
                      query builder
                    </a>{" "}
                    and end-to-end type safety.
                  </li>
                  <li>
                    <b>Performance</b>: EdgeDB{" "}
                    <a href="blog/why-orms-are-slow-and-getting-slower">
                      puts ORMs to shame
                    </a>
                    .
                  </li>
                  <li>
                    <b>Strict types</b>: Keep your data types in your schema,
                    not in your head.
                  </li>
                  <li>
                    <b>Reliability</b>: Powered by PostgreSQL.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <div className={styles.darkBackground}>
        <div className="globalPageWrapper">
          <div className={styles.content}>
            <h2>Event Highlights</h2>
            <div className={styles.highlightsCards}>
              <div className={styles.highlightsCard}>
                <h3>EdgeDB 4.0</h3>
                <p>
                  Discover the next evolution of the graph-relational database!
                </p>
                <p>
                  Introducing the new features that EdgeDB 4.0 brings along
                  with <b>full-text search</b> and <b>integrated auth</b>.
                </p>
              </div>
              <div className={styles.highlightsCard}>
                <h3>EdgeDB Cloud</h3>
                <p>
                  The easiest way to take your database from development to
                  production launches today!
                </p>
                <p>
                  Learn how EdgeDB Cloud works, what it can do for you, and
                  what's coming next.
                </p>
              </div>
              <div className={styles.highlightsCard}>
                <h3>EdgeDB in the wild</h3>
                <p>
                  Hear the real-life stories of developers building products
                  with EdgeDB!
                </p>
                <p>
                  Dive deep into first-hand accounts of use cases, both
                  conventional and unexpected.
                </p>
              </div>
            </div>
            <div className={styles.highlightsDiscord}>
              <div className={styles.chatHeaderBg}>
                <h3>
                  Plus <span>live Q&A</span> and <span>chat</span> with the
                  core team
                </h3>
              </div>
              <p>
                Join us in our Discord during and after the event for a special
                Developer Day edition of Office Hours. Ask members of the team
                any questions you have about EdgeDB 4.0, and get an opportunity
                to win some swanky EdgeDB swag!
              </p>
              <a
                className={styles.discordLink}
                href="https://discord.gg/umUueND6ag"
              >
                <DiscordIcon />
                Join EdgeDB Discord
              </a>
            </div>

            <h2>Schedule</h2>
            <div className={styles.schedule}>
              {scheduleItems.map((item, i) => (
                <div key={i} className={styles.scheduleItem}>
                  <div className={styles.speakers}>
                    <div className={styles.avatars}>
                      {[...item.avatarUrls].reverse().map((url, i) => (
                        <img
                          key={i}
                          src={
                            url ||
                            "data:image/gif;base64,R0lGODlhAQABAIAAAP" +
                              "///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
                          }
                        />
                      ))}
                    </div>
                    {item.speakers}
                    <div className={styles.company}>{item.company}</div>
                  </div>
                  <svg
                    className={styles.line}
                    viewBox="0 0 48 48"
                    preserveAspectRatio="none"
                  >
                    <path d="M 24 0 v 48" />
                  </svg>
                  <svg className={styles.dot} viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="10" />
                  </svg>
                  <div className={styles.itemContent}>
                    <h3>{item.title}</h3>
                    {item.content}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.outro}>
              Join us for Developer Day to learn about some of the incredible
              creations built on EdgeDB so far and to discover what new things
              will be possible with EdgeDB 4.0 and EdgeDB Cloud!
            </div>

            <JoinButton className={styles.outroButton} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function getTeamAvatar(name: string) {
  return require(`content/about/photos/${name}.jpg`).default.src;
}

function getUserAvatar(company: string, name: string) {
  return require(`content/users/${company}/${name}.jpg`).default.src;
}
