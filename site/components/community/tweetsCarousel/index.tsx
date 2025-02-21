import {useState, useRef, useEffect} from "react";

import cn from "@edgedb-site/shared/utils/classNames";

import {User} from "dataSources/twitter/interfaces";

import {ChevronLeftIcon} from "@/components/icons";

import styles from "./tweetsCarousel.module.scss";
import {TwitterIcon} from "@edgedb-site/shared/components/icons";

const OVERLAP = 3;
const AUTO_TRANSITION_INTERVAL = 5000;

interface Tweet {
  id: string;
  user: User;
  html: string;
}

interface TweetsCarouselProps {
  tweets: Tweet[];
}

export default function TweetsCarousel({tweets}: TweetsCarouselProps) {
  const allTweets = [
    ...tweets.slice(-OVERLAP),
    ...tweets,
    ...tweets.slice(0, OVERLAP),
  ];

  const [selectedTweet, setSelectedTweet] = useState(0);
  const [autoMode, setAutoMode] = useState(true);

  const sliderRef = useRef<HTMLDivElement>(null);

  function selectTweet(offset: number) {
    let newIndex = selectedTweet + offset;

    if (newIndex < 0 || newIndex >= tweets.length) {
      newIndex = newIndex < 0 ? tweets.length : -1;

      sliderRef.current!.classList.add(styles.disableTransition);
      sliderRef.current!.style.transform = `translateX(${
        (newIndex + OVERLAP) * -100
      }%)`;
      // force repaint
      sliderRef.current!.scrollTop;

      sliderRef.current!.classList.remove(styles.disableTransition);
      setSelectedTweet(newIndex < 0 ? 0 : tweets.length - 1);

      return;
    }

    setSelectedTweet(newIndex);
  }

  useEffect(() => {
    if (autoMode) {
      let timer = setTimeout(() => {
        selectTweet(+1);
      }, AUTO_TRANSITION_INTERVAL);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [autoMode, selectTweet]);

  return (
    <div
      className={styles.tweetsCarousel}
      onMouseEnter={() => setAutoMode(false)}
      onMouseLeave={() => setAutoMode(true)}
    >
      <div className={styles.buttons}>
        <div className={styles.prevTweet} onClick={() => selectTweet(-1)}>
          <ChevronLeftIcon />
        </div>
        <div className={styles.nextTweet} onClick={() => selectTweet(+1)}>
          <ChevronLeftIcon />
        </div>
      </div>
      <div
        ref={sliderRef}
        className={styles.tweets}
        style={{
          transform: `translateX(${(selectedTweet + OVERLAP) * -100}%)`,
        }}
      >
        {allTweets.map((tweet, i) => (
          <div
            className={cn(styles.tweetCard, {
              [styles.active]: i === selectedTweet + OVERLAP,
            })}
            key={i}
          >
            <a
              href={`https://twitter.com/${tweet.user.username}/status/${tweet.id}`}
              target="_blank"
              className={styles.tweetLink}
            >
              see on twitter
              <TwitterIcon />
            </a>
            <img
              className={styles.profileImage}
              src={tweet.user.profileImageUrl}
            />
            <div className={styles.username}>{tweet.user.name}</div>
            <div dangerouslySetInnerHTML={{__html: tweet.html}} />
          </div>
        ))}
      </div>
    </div>
  );
}
