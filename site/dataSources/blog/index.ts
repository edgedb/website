import {PromiseType} from "@edgedb-site/shared/utils/typing";
import formatDate from "date-fns/format";
import {BlogAuthor, BlogPost} from "dataBuild/interfaces";

import {getSourceData, pick} from "../utils";

const getBlogData = () =>
  getSourceData(["blog"]) as Promise<{
    authors: BlogAuthor[];
    posts: BlogPost[];
  }>;

const formatPublishDate = (dateStr: string) =>
  formatDate(new Date(dateStr), "MMMM dd, yyyy");

const getSortedPosts = async () => {
  return (await getBlogData()).posts
    .filter((post) => post.basename !== "__index__")
    .map((post) => ({
      ...post,
      publishedOnTimestamp: new Date(post.publishedOn!).getTime(),
      publishedOnFormatted: formatPublishDate(post.publishedOn!),
    }))
    .sort((a, b) => b.publishedOnTimestamp - a.publishedOnTimestamp);
};

export async function getAllBlogPosts() {
  return (await getSortedPosts()).map((post) => ({
    ...pick(post, [
      "id",
      "slug",
      "title",
      "description",
      "leadImage",
      "publishedOnFormatted",
    ]),
    authors: post.authors.map((author) => ({...pick(author, ["id", "name"])})),
  }));
}

export type BlogPostsSummary = PromiseType<ReturnType<typeof getAllBlogPosts>>;

export async function getBlogPost(slug: string) {
  const allPosts = await getSortedPosts();

  const postIndex = allPosts.findIndex((post) => post.slug === slug)!;

  const post = allPosts[postIndex];
  const recommendationSlugs = allPosts[postIndex]?.recommendations;
  const recommendations = [];

  if (recommendationSlugs?.length) {
    const allSlugs = allPosts.map((post) => post.slug);

    recommendationSlugs?.forEach((slug) => {
      const index = allSlugs.indexOf(slug);
      if (index > -1) recommendations.push(allPosts[index]);
      else throw new Error(`Recommendation with slug ${slug} doesn't exist.`);
    });
  } else {
    const nextPost = allPosts[postIndex - 1];
    const prevPost = allPosts[postIndex + 1];

    if (!prevPost) {
      const nextOfNextPost = allPosts[postIndex - 2];
      if (nextOfNextPost) recommendations.push(nextOfNextPost);
    }

    if (nextPost) recommendations.push(nextPost);
    if (prevPost) recommendations.push(prevPost);

    if (!nextPost) {
      const prevOfPrevPost = allPosts[postIndex + 2];
      if (prevOfPrevPost) recommendations.push(prevOfPrevPost);
    }
  }

  recommendations.sort(
    (a, b) => b.publishedOnTimestamp - a.publishedOnTimestamp
  );

  return {
    post: {
      ...pick(post, [
        "id",
        "title",
        "leadImage",
        "leadImageAlt",
        "leadYT",
        "description",
        "headers",
        "document",
        "publishedOnFormatted",
      ]),
      authors: post.authors.map((author) => ({
        ...pick(author, ["id", "name", "github", "twitter", "avatarUrl"]),
      })),
    },
    recommendations,
  };
}

export type BlogPostData = PromiseType<ReturnType<typeof getBlogPost>>;
