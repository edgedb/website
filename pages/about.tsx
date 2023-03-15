import React from "react";

import {GetStaticProps} from "next";
import Link from "next/link";
import MainLayout from "@/components/layouts/main";
import MetaTags from "@/components/metatags";
import WebGLWrapper from "@/components/homepage/webgl";
import {
  BackgroundBlock,
  BackgroundFader,
} from "@/components/homepage/backgroundFader";
import InvestorCard from "@/components/about/investorCard";
import {angelInvestors} from "dataSources/data";
import {loadAboutPageData} from "dataSources/about";
import {
  AccelIcon,
  NavaIcon,
  PearIcon,
  SVAngelIcon,
  L2VenturesIcon,
  JoinUsBgIcon,
} from "@/components/icons/about";
import Media from "@/components/about/media/media";
import MemberCard, {TeamMember} from "@/components/about/memberCard";
import {Article} from "@/components/about/mediaCard";
import styles from "@/styles/about.module.scss";

interface AboutPageProps {
  team: TeamMember[];
  media: Article[];
}

// if we decide to use grid for investors' cards
// const investorsCount = angelInvestors.length;
// const isLastAngelInvestorsRowCentered = investorsCount % 3 === 1;

const AboutPage = ({team, media}: AboutPageProps) => (
  <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
    <MetaTags
      title="About us"
      description={`Find out who are EdgeDB builders and investors. And read more about EdgeDB in media.`}
      relPath="/about"
    />
    <WebGLWrapper>
      <BackgroundFader usePageBackground>
        <div className="globalPageWrapper">
          <div className={styles.content}>
            <BackgroundBlock colour="ffffff" particleColour="f1f1f1">
              <h1>
                We build the database developers <span>love</span> to use.
              </h1>
              <p className={styles.intro}>
                SQL databases were designed for business people and analysts.
                But is there a database built specifically for developers? Meet
                EdgeDB — the world’s first graph-relational database. EdgeDB
                gives you a modern data model that bridges the gap between your
                programming language and your data. EdgeDB ships with beautiful
                APIs, best in class tooling, and obsessively written docs. We
                tie the whole thing together with EdgeQL: a query language for
                those of us who couldn’t tie a neck tie to save our lives.
              </p>
              <section className={styles.teamSection}>
                <h2>
                  Our <span>team</span>
                </h2>
                <p className={styles.teamDesc}>
                  We build EdgeDB with awesome people from across the globe.
                </p>
                <div className={styles.team}>
                  {team.map((member) => (
                    <MemberCard
                      {...member}
                      classes={styles.member}
                      key={member.name}
                    />
                  ))}
                </div>
                <Link href="/careers">
                  <div className={styles.joinUsBtnWrapper}>
                    <div className={styles.joinUsButton}>
                      <span>Join us</span>
                    </div>
                    <JoinUsBgIcon />
                  </div>
                </Link>
                <p className={styles.joinUsText}>
                  to help shape the future of databases!
                </p>
              </section>
              <section className={styles.section}>
                <h2>
                  Our <span>investors</span>
                </h2>
                <p>
                  Our bold vision is supported by some of the best investors in
                  the world.
                </p>
                <div className={styles.leadInvestors}>
                  <AccelIcon />
                  <NavaIcon />
                  <PearIcon />
                  <SVAngelIcon />
                  <L2VenturesIcon />
                </div>
                <div className={styles.angelInvestors}>
                  {angelInvestors.map((investor, i) => (
                    <InvestorCard
                      {...investor}
                      key={investor.name}
                      classes={styles.investor}
                    />
                  ))}
                </div>
                <p className={styles.announcement}>
                  Read our{" "}
                  <Link href="/blog/edgedb-series-a">
                    <a>Series A announcement</a>
                  </Link>
                  .
                </p>
              </section>
              <section className={styles.section}>
                <h2>Media</h2>
                <Media items={media} />
              </section>
            </BackgroundBlock>
          </div>
        </div>
      </BackgroundFader>
    </WebGLWrapper>
  </MainLayout>
);

export default AboutPage;

export const getStaticProps: GetStaticProps<AboutPageProps> = async () => ({
  props: await loadAboutPageData(),
});
