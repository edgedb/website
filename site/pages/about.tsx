import React from "react";

import {GetStaticProps} from "next";
import Link from "next/link";
import MainLayout from "@/components/layouts/main";
import MetaTags from "@/components/metatags";
import InvestorCard from "@/components/about/investorCard";
import {angelInvestors} from "dataSources/data";
import {loadAboutPageData} from "dataSources/about";
import {
  AccelIcon,
  NavaIcon,
  PearIcon,
  SVAngelIcon,
  L2VenturesIcon,
} from "@/components/icons/about";
import MemberCard, {TeamMember} from "@/components/about/memberCard";
import styles from "@/styles/about.module.scss";

interface AboutPageProps {
  team: TeamMember[];
}

// if we decide to use grid for investors' cards
// const investorsCount = angelInvestors.length;
// const isLastAngelInvestorsRowCentered = investorsCount % 3 === 1;

const AboutPage = ({team}: AboutPageProps) => (
  <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
    <MetaTags
      title="About us"
      description={`Find out who are EdgeDB builders and investors.`}
      relPath="/about"
    />
    <div className="globalPageWrapper">
      <div className={styles.content}>
        <h1>
          We build the database developers <span>love</span> to use.
        </h1>
        <p className={styles.intro}>
          We're giving it to them with the world's first graph-relational
          database: the maintainability of a strict schema paired with the
          ability to easily link objects. We tie the whole thing together with
          EdgeQL: a query language for those of us who couldn't tie a neck tie
          to save our lives.
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
          {/* <Link href="/careers">
            <div className={styles.joinUsBtnWrapper}>
              <div className={styles.joinUsButton}>
                <span>+</span>
                Join us
              </div>
            </div>
          </Link>
          <p className={styles.joinUsText}>
            To help shape the future of databases!
          </p> */}
        </section>
        <section className={styles.section}>
          <h2>
            Our <span>investors</span>
          </h2>
          <p>
            Our bold vision is supported by some of the best investors in the
            world.
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
            <Link href="/blog/edgedb-series-a">Series A announcement</Link>.
          </p>
        </section>
      </div>
    </div>
  </MainLayout>
);

export default AboutPage;

export const getStaticProps: GetStaticProps<AboutPageProps> = async () => ({
  props: await loadAboutPageData(),
});
