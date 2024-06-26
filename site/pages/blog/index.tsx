import {GetStaticProps} from "next";
import Link from "next/link";

import {ElementType} from "@edgedb-site/shared/utils/typing";

import MainLayout from "@/components/layouts/main";
import PostAuthors from "@/components/blog/authors";
import LazyImage from "@edgedb-site/shared/components/lazyImage";

import styles from "@/styles/blog.module.scss";

import {getAllBlogPosts, BlogPostsSummary} from "dataSources/blog";
import MetaTags from "@/components/metatags";

interface PageProps {
  blogPosts: BlogPostsSummary;
}

export default function BlogIndexPage({blogPosts}: PageProps) {
  return (
    <MainLayout className={styles.page}>
      <MetaTags
        title={`Blog`}
        description={`Post, articles, and announcements about EdgeDB, the next evolution of relational databases.`}
        relPath="/blog"
      />
      <div className="globalPageWrapper">
        <div className={styles.cards}>
          {blogPosts.map((post) => (
            <BlogPostCard post={post} key={post.id} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

function BlogPostCard({post}: {post: ElementType<BlogPostsSummary>}) {
  return (
    <Link href={`/blog/${post.slug}`} className={styles.blogCard}>
      <div className={styles.blogCardContent}>
        <LazyImage
          className={styles.leadImage}
          url={post.leadImage!.path}
          width={post.leadImage!.width}
          height={post.leadImage!.height}
          thumbnail={post.leadImage!.thumbnail}
        />
        <div className={styles.cardDetails}>
          <div>
            <div className={styles.cardDate}>{post.publishedOnFormatted}</div>
            <h2>{post.title}</h2>
            <p>{post.description}</p>
          </div>
          <PostAuthors
            className={styles.card_authors}
            authors={post.authors}
            minimal
          />
        </div>
      </div>
    </Link>
  );
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  return {
    props: {
      blogPosts: await getAllBlogPosts(),
    },
  };
};
