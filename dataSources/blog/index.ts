import {PromiseType} from "@/utils/typing";
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
  const nextPost = allPosts[postIndex - 1];
  const prevPost = allPosts[postIndex + 1];

  return {
    post: {
      ...pick(post, [
        "id",
        "title",
        "leadImage",
        "description",
        "headers",
        "document",
        "publishedOnFormatted",
      ]),
      authors: post.authors.map((author) => ({
        ...pick(author, ["id", "name", "github", "twitter", "avatarUrl"]),
      })),
    },
    nav: {
      next: nextPost
        ? {
            url: `/blog/${nextPost.slug!}`,
            title: nextPost.title!,
            label: "Next Post",
          }
        : null,
      prev: prevPost
        ? {
            url: `/blog/${prevPost.slug!}`,
            title: prevPost.title!,
            label: "Previous Post",
          }
        : null,
    },
  };
}

export type BlogPostData = PromiseType<ReturnType<typeof getBlogPost>>;
