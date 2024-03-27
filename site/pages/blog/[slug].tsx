import {GetStaticPaths, GetStaticProps} from "next";

import MainLayout from "@/components/layouts/main";
import PostAuthors from "@/components/blog/authors";
import LazyImage from "@edgedb-site/shared/components/lazyImage";
import BlogToC from "@/components/blog/toc";
import MetaTags from "@/components/metatags";

import {getAllBlogPosts, getBlogPost, BlogPostData} from "dataSources/blog";

import baseStyles from "@edgedb-site/shared/xmlRenderer/base.module.scss";
import styles from "@/styles/blogPost.module.scss";

import {renderDocument} from "@edgedb-site/shared/xmlRenderer";
import {
  blogRenderComponents,
  blogReactComponents,
} from "@/components/xmlRenderer/blogComponents";
import {CodeTabContextProvider} from "@edgedb-site/shared/components/code/tabs";
import ThumbnailsFooter from "@/components/thumbnailsFooter";

type PageParams = {
  slug: string;
};

type PageProps = BlogPostData & {
  slug: string;
};

export default function BlogPage({post, recommendations, slug}: PageProps) {
  return (
    <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
      <MetaTags
        title={post.title!}
        siteTitle="EdgeDB Blog"
        description={post.description!}
        imagePath={post.leadImage!.path + ".jpg"}
        relPath={`/blog/${slug}`}
      />
      <div className="globalPageWrapperBlog" key={post.id}>
        <BlogToC headers={post.headers} postTitle={post.title!} />
        <div className={styles.pageContent}>
          <div className={styles.postHeader}>
            <div className={styles.publishedOn}>
              {post.publishedOnFormatted}
            </div>
            <h1>{post.title}</h1>
            <PostAuthors authors={post.authors} className={styles.authors} />
            {post.leadYT ? (
              <div className={styles.leadYoutubeEmbed}>
                <iframe
                  src={`https://www.youtube.com/embed/${post.leadYT}`}
                  frameBorder={0}
                  allowFullScreen
                  // @ts-ignore
                  loading="lazy"
                />
              </div>
            ) : (
              <LazyImage
                className={styles.leadImage}
                url={post.leadImage!.path}
                alt={post.leadImageAlt}
                width={post.leadImage!.width}
                height={post.leadImage!.height}
                thumbnail={post.leadImage!.thumbnail}
                widths={[940, 770]}
                sizes={{
                  default: 1120,
                  xl: 940,
                  lg: 840,
                  md: 680,
                  sm: "100vw",
                }}
              />
            )}
          </div>
          <div className={styles.postContent}>
            <CodeTabContextProvider>
              {renderDocument(
                post.document,
                styles,
                blogRenderComponents,
                blogReactComponents,
                baseStyles
              )}
            </CodeTabContextProvider>
          </div>
        </div>
      </div>
      <ThumbnailsFooter posts={recommendations} />
      <div id="__blog_overlay_portal" />
    </MainLayout>
  );
}

export const getStaticPaths: GetStaticPaths<PageParams> = async () => {
  const blogPosts = await getAllBlogPosts();

  return {
    paths: blogPosts
      .map((post) => ({
        params: {slug: post.slug!},
      }))
      .filter((page) => page.params.slug !== undefined),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PageProps, PageParams> = async (
  ctx
) => {
  return {
    props: {
      slug: ctx.params!.slug,
      ...(await getBlogPost(ctx.params!.slug)),
    },
  };
};
