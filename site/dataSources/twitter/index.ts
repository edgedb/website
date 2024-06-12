import _tweetData from "./tweetData";
import {Tweet} from "./interfaces";

const tweetData = _tweetData as Tweet[];

const maxTweets = 20;

function splitUnicodeChars(str: string): string[] {
  const splitChars = [];

  for (let i = 0; i < str.length; ) {
    const charCode = str.codePointAt(i);

    if (charCode === undefined) {
      break;
    }

    if (charCode <= 0xffff) {
      splitChars.push(str[i++]);
    } else {
      splitChars.push(str.slice(i, i + 2));
      i += 2;
    }
  }

  return splitChars;
}

function replaceTweetText(text: string, entities: Tweet["entities"]) {
  const sortedEntities = [
    ...entities.mentions.map((mention) => ({type: "mention", ...mention})),
    ...entities.hashtags.map((hashtag) => ({type: "hashtag", ...hashtag})),
    ...entities.urls.map((url) => ({type: "url", ...url})),
  ].sort((a, b) => a.indices[0] - b.indices[0]) as (
    | ({
        type: "mention";
      } & Tweet["entities"]["mentions"][0])
    | ({
        type: "hashtag";
      } & Tweet["entities"]["hashtags"][0])
    | ({
        type: "url";
      } & Tweet["entities"]["urls"][0])
  )[];

  if (!sortedEntities.length) {
    return text;
  }

  const splitText = splitUnicodeChars(text);

  let replacedText = "";
  let prevIndex = 0;
  for (const entity of sortedEntities) {
    replacedText += splitText.slice(prevIndex, entity.indices[0]).join("");
    switch (entity.type) {
      case "mention":
        replacedText += `<a href="https://twitter.com/${
          entity.username
        }">${splitText
          .slice(entity.indices[0], entity.indices[1])
          .join("")}</a>`;
        break;
      case "hashtag":
        replacedText += `<a href="https://twitter.com/hashtag/${
          entity.tag
        }">${splitText
          .slice(entity.indices[0], entity.indices[1])
          .join("")}</a>`;
        break;
      case "url":
        replacedText += `<a href="${entity.url}">${entity.displayUrl}</a>`;
        break;
    }
    prevIndex = entity.indices[1];
  }

  replacedText += splitText.slice(prevIndex).join("");

  replacedText = replacedText.replace(/\n/g, "<br>");

  return replacedText;
}

export function getTweets() {
  const randomTweets: (Pick<Tweet, "id" | "user"> & {html: string})[] = [];
  const tweets = [...tweetData];

  const tweetsCount = Math.min(tweets.length, maxTweets);
  for (let i = 0; i < tweetsCount; i++) {
    const tweet = tweets.splice(
      Math.floor(Math.random() * tweets.length),
      1
    )[0];
    randomTweets.push({
      id: tweet.id,
      html: replaceTweetText(tweet.text, tweet.entities),
      user: tweet.user,
    });
  }

  return randomTweets;
}

export type TweetsData = ReturnType<typeof getTweets>;
