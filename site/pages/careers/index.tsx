import {useState, useRef} from "react";
import {GetStaticProps} from "next";
import Head from "next/head";
import Link from "next/link";

import cn from "@edgedb-site/shared/utils/classNames";

import MainLayout from "@/components/layouts/main";

import {getAllPositions, PositionsList} from "dataSources/careers";

import {
  DevelopmentIcon,
  HealthIcon,
  ScheduleIcon,
  TimeOffIcon,
} from "@/components/icons/community";
import {ChevronLeftIcon} from "@/components/icons";

import styles from "@/styles/careers.module.scss";
import MetaTags from "@/components/metatags";

interface PageProps {
  positions: PositionsList;
}

export default function CareersPage({positions}: PageProps) {
  return (
    <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
      <MetaTags
        title={`Careers`}
        description={`We're hiring!`}
        relPath="/careers"
      />
      <div className={styles.balloonsWrapper}>
        <div className={styles.balloons}>
          {Array(7)
            .fill(0)
            .map((_, i) => (
              <div key={i} />
            ))}
        </div>
      </div>
      <div className="globalPageWrapper">
        <div className={styles.content}>
          <h1 className={styles.title}>Join the Team</h1>
          <p className={styles.intro}>
            Our mission is to build the world's most developer-friendly
            database.
          </p>

          <div className={styles.positions}>
            {positions.length > 0 ? (
              positions.map((position) => (
                <Link
                  href={`/careers/${position.id}`}
                  key={position.id}
                  className={styles.positionCard}
                >
                  <div className={styles.location}>{position.location}</div>
                  <span>{position.title}</span>
                  <div className={styles.readmore}>Read More</div>
                </Link>
              ))
            ) : (
              <div className={styles.emptyPositions}>
                <p>
                  Thank you for expressing interest in potential job
                  opportunities at EdgeDB!
                </p>
                <p>
                  At this moment, we are not actively hiring. However if you
                  are an ex-founder of a dev tool company or have deep
                  expertise in building dev tool products, we would like to
                  hear from you! Please feel free to drop us a line at{" "}
                  <a href="mailto:jobs@edgedb.com">jobs@edgedb.com</a>.
                </p>
              </div>
            )}
          </div>

          <h2 className={styles.subheader}>Benefits</h2>
          <div className={styles.benefitsBlock}>
            <div className={styles.benefitsCard}>
              <HealthIcon />
              <h3>Health and Wellness</h3>
              <p>
                We offer great health coverage for you and your dependents.
              </p>
            </div>
            <div className={styles.benefitsCard}>
              <TimeOffIcon />
              <h3>Flexible Time Off</h3>
              <p>
                We care about results and long-term productivity, not clock
                time. Take your time off when you need it.
              </p>
            </div>
            <div className={styles.benefitsCard}>
              <ScheduleIcon />
              <h3>Flexible Schedule</h3>
              <p>
                You are free to organize your work day in a way that makes you
                most productive.
              </p>
            </div>
            <div className={styles.benefitsCard}>
              <DevelopmentIcon />
              <h3>Career Development</h3>
              <p>
                We support your growth by providing an annual grant toward
                learning, workshops and conferences.
              </p>
            </div>
          </div>

          <CardSlider
            className={styles.cards}
            title="Culture"
            cards={[
              {
                title: "Learning and Growth",
                content: `
                  Building new things naturally requires lots of learning and
                  exploration, and we value curiosity and open-mindedness. We
                  grow as a company, but also as individuals and professionals.`,
              },
              {
                title: "Excellence and Ambition",
                content: `
                  We are building the next generation of database tooling. This
                  is an exciting and challenging undertaking that rewards
                  creativity and thinking outside the box.`,
              },
              {
                title: "Life and Work",
                content: `
                  We believe that the best kind of productivity is the one
                  achieved through a healthy, balanced lifestyle. Taking time
                  to rest, spending time with family and engaging in non-work
                  activities are just as important as committing code.`,
              },
              {
                title: "Openness and Respect",
                content: `
                  The most valuable asset of a database company is trust. We
                  build trust by being open about our source code, our
                  practices and plans. We value openness and respect in
                  communication with our employees and customers.`,
              },
              {
                title: "Compassion and Humanity",
                content: `
                  You are a human first and a team member second. Our flexible
                  scheduling and time-off policies embody this, but so do our
                  people. At EdgeDB, you'll always be treated with compassion,
                  no matter what life throws at you.`,
              },
            ]}
          />
        </div>
      </div>
    </MainLayout>
  );
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  return {
    props: {
      positions: (await getAllPositions()) ?? null,
    },
  };
};

interface CardSliderProps {
  title: string;
  cards: {title: string; content: string}[];
  className?: string;
}

function CardSlider({title, cards: _cards, className}: CardSliderProps) {
  const overlap = Math.ceil(_cards.length / 2) - 1;
  const indexedCards = _cards.map((card, index) => ({...card, index}));
  const cards = [
    ...indexedCards.slice(-overlap),
    ...indexedCards,
    ...indexedCards.slice(0, overlap),
  ];

  const [cardIndex, setCardIndex] = useState(0);

  const sliderRef = useRef<HTMLDivElement>(null);

  function selectCard(index: number) {
    const offset = index - cardIndex;
    if (Math.abs(offset) > _cards.length / 2) {
      const offsetIndex =
        cardIndex + (offset < 0 ? -_cards.length : _cards.length);

      sliderRef.current!.classList.add(styles.disableTransition);
      sliderRef.current!.style.setProperty(
        "--cardsOffset",
        `translateX(${-(offsetIndex + overlap) * 100}%)`
      );
      // force repaint
      sliderRef.current!.scrollTop;

      sliderRef.current!.classList.remove(styles.disableTransition);
    }

    setCardIndex(index);
  }

  return (
    <div className={cn(styles.cardSlider, className)}>
      <h2 className={styles.subheader}>{title}</h2>
      <div
        className={styles.cardsWrapper}
        ref={sliderRef}
        style={
          {
            "--cardsOffset": `translateX(${-(cardIndex + overlap) * 100}%)`,
          } as any
        }
      >
        <div className={cn(styles.cards, styles.bgNumbers)}>
          {cards.map((card, i) => (
            <div className={styles.card} key={i}>
              <svg viewBox="0 0 175 100">
                <text
                  x="87.5"
                  y="50"
                  textLength="175"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {(card.index + 1).toString().padStart(2, "0")}
                </text>
              </svg>
            </div>
          ))}
        </div>
        <div className={cn(styles.cards, styles.headerUnderlines)}>
          {cards.map((card, i) => (
            <div className={styles.card} key={i}>
              <h3>{card.title}</h3>
            </div>
          ))}
        </div>
        <div className={styles.cards}>
          {cards.map((card, i) => (
            <div className={styles.card} key={i}>
              <h3>{card.title}</h3>
              <p>{card.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div
        className={styles.leftArrow}
        onClick={() =>
          selectCard((cardIndex === 0 ? _cards.length : cardIndex) - 1)
        }
      >
        <ChevronLeftIcon />
      </div>
      <div
        className={styles.rightArrow}
        onClick={() =>
          selectCard((cardIndex === _cards.length - 1 ? -1 : cardIndex) + 1)
        }
      >
        <ChevronLeftIcon />
      </div>

      <div className={styles.dots}>
        {_cards.map((_, i) => (
          <div
            key={i}
            className={cn(styles.dot, {
              [styles.active]: i === cardIndex,
            })}
            onClick={() => selectCard(i)}
          />
        ))}
      </div>
    </div>
  );
}
