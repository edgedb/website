import {PromiseType} from "@edgedb-site/shared/utils/typing";
import formatDate from "date-fns/format";
import {UpdatePost} from "dataBuild/interfaces";
import {getSourceData, pick} from "../utils";

const getUpdatePostData = () =>
  getSourceData(["updates"]) as Promise<{
    posts: UpdatePost[];
  }>;

const formatPublishDate = (dateStr: string) =>
  formatDate(new Date(dateStr), "MMMM dd, yyyy");

const getSortedPosts = async () => {
  return (await getUpdatePostData()).posts
    .filter((post) => post.basename !== "__index__")
    .map((post) => ({
      ...post,
      publishedOnTimestamp: new Date(post.publishedOn!).getTime(),
      publishedOn: formatPublishDate(post.publishedOn!),
      publishedOnHref: formatPublishDate(post.publishedOn!)
        .replace(/\s+/g, "-")
        .replace(/,/g, "")
        .toLowerCase(),
      titleHref: post.title?.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase(),
    }))
    .sort((a, b) => b.publishedOnTimestamp - a.publishedOnTimestamp);
};

export async function getAllUpdatePosts() {
  return (await getSortedPosts()).map((post) => ({
    ...pick(post, [
      "id",
      "title",
      "publishedOn",
      "document",
      "titleHref",
      "publishedOnHref",
    ]),
  }));
}

export type UpdatePostsData = PromiseType<
  ReturnType<typeof getAllUpdatePosts>
>;
