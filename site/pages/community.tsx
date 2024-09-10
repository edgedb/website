import {GetStaticProps} from "next";
import Link from "next/link";

import MainLayout from "@/components/layouts/main";
import TweetsCarousel from "@/components/community/tweetsCarousel";
import {SubscribePopup} from "@/components/subscribe";

import {useOverlayActive} from "@edgedb-site/shared/hooks/useOverlayActive";
import {TwitterIcon} from "@edgedb-site/shared/components/icons";

import {getTweets, TweetsData} from "dataSources/twitter";

import {
  GitHubIcon,
  BlogIcon,
  EmailIcon,
  BalloonsIcon,
  QuickStartIcon,
  DocumentationIcon,
  TutorialIcon,
  DiscordIcon,
} from "@/components/icons";

import styles from "@/styles/community.module.scss";
import MetaTags from "@/components/metatags";

interface Event {
  title: string;
  day: number;
  month: string;
  year: number;
  description: string;
}

const events: Event[] = [];

interface PageProps {
  tweets: TweetsData;
}

export default function CommunityPage({tweets}: PageProps) {
  const [subscribePopupOpen, setSubscribePopupOpen] = useOverlayActive(
    "CommunityPageSubscribe"
  );

  return (
    <MainLayout className={styles.page}>
      <MetaTags
        title="Join the Community"
        description={`Check out our blog posts, subscribe to stay updated, or get in touch with us on GitHub.`}
        relPath="/community"
      />
      {subscribePopupOpen ? (
        <SubscribePopup onClose={() => setSubscribePopupOpen(false)} />
      ) : null}
      <div className="globalPageWrapper">
        <div className={styles.content}>
          <div className={styles.introWrapper}>
            <div className={styles.illustration} />
            <h1 className={styles.title}>Join the Community</h1>

            <div className={styles.intro}>
              <p>
                We’d love to engage with you on{" "}
                <a href="https://twitter.com/edgedatabase">
                  <TwitterIcon />
                  Twitter
                </a>{" "}
                and{" "}
                <a href="https://discord.gg/umUueND6ag">
                  <DiscordIcon />
                  Discord
                </a>
                , and hear your suggestions on{" "}
                <a href="https://github.com/edgedb">
                  <GitHubIcon />
                  GitHub
                </a>
                .
              </p>
              <p>
                Read our{" "}
                <Link href="/blog">
                  <BlogIcon />
                  Blog
                </Link>{" "}
                to learn more about EdgeDB design and{" "}
                <a onClick={() => setSubscribePopupOpen(true)}>
                  <EmailIcon />
                  Subscribe
                </a>{" "}
                to our mailing list to be the first to know about new updates.
              </p>
              <p>
                Submit an{" "}
                <a href="https://github.com/edgedb/rfcs">
                  <BalloonsIcon />
                  RFC
                </a>{" "}
                if you want EdgeDB to get a new big feature!
              </p>
            </div>
          </div>

          {events.length ? (
            <>
              <h2>Upcoming Events</h2>
              <div className={styles.events}>
                {events.map((event, i) => (
                  <div className={styles.event} key={i}>
                    <div className={styles.eventCard}>
                      <div className={styles.day}>{event.day}</div>
                      <div className={styles.month}>{event.month}</div>
                      <div className={styles.year}>{event.year}</div>
                    </div>
                    <div className={styles.details}>
                      <h3>{event.title}</h3>
                      <p
                        dangerouslySetInnerHTML={{__html: event.description}}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <h2>Resources to Learn</h2>
          <div className={styles.resources}>
            <Link
              href="/docs/guides/quickstart"
              className={styles.resourceLink}
            >
              <QuickStartIcon />
              Quick Start
            </Link>
            <Link href="/docs" className={styles.resourceLink}>
              <DocumentationIcon />
              Documentation
            </Link>
            <Link href="/tutorial" className={styles.resourceLink}>
              <TutorialIcon />
              Interactive
            </Link>
          </div>

          <div className={styles.tweetsWrapper}>
            <h2>People About Us on Twitter</h2>
            <p>
              Use the <a href="https://twitter.com/hashtag/edgedb">#edgedb</a>{" "}
              tag on Twitter to let us know your thoughts.
            </p>
            <TweetsCarousel tweets={tweets} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  return {
    props: {
      tweets: getTweets(),
    },
  };
};
