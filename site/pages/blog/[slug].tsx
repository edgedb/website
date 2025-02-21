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
import ShareAndSubscribe from "@/components/blog/shareAndSubscribe";

type PageParams = {
  slug: string;
};

type PageProps = BlogPostData & {
  slug: string;
};

// Brightness is a number between 0 and 255
const getOpacity = (brightness = 0) => {
  return brightness < 90
    ? 0.4
    : brightness < 120
    ? 0.3
    : brightness < 160
    ? 0.2
    : brightness < 195
    ? 0.15
    : 0.1;
};

export default function BlogPage({post, recommendations, slug}: PageProps) {
  return (
    <MainLayout
      className={styles.page}
      footerClassName={styles.pageFooter}
      style={
        {
          "--backgroundImage": `url(${post.leadImage?.thumbnail})`,
          "--opacity": getOpacity(post.leadImage?.brightness),
        } as any
      }
    >
      <MetaTags
        title={post.title!}
        siteTitle="EdgeDB Blog"
        description={post.description!}
        imagePath={post.leadImage!.path + ".jpg"}
        relPath={`/blog/${slug}`}
      />
      <div className="globalPageWrapperBlog" key={post.id}>
        <BlogToC headers={post.headers} />
        <div className={styles.pageContent} data-theme="dark">
          <div className={styles.postHeader}>
            <span className={styles.publishedOn}>
              {post.publishedOnFormatted}
            </span>
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
        <ShareAndSubscribe postTitle={post.title!} />
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
