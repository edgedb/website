import {GetStaticPaths, GetStaticProps} from "next";

import MainLayout from "@/components/layouts/main";
import PostAuthors from "@/components/blog/authors";
import LazyImage from "@/components/lazyImage";
import BlogToC from "@/components/blog/toc";
import FooterNav from "@/components/footerNav";
import MetaTags from "@/components/metatags";

import {getAllBlogPosts, getBlogPost, BlogPostData} from "dataSources/blog";

import styles from "@/styles/blogPost.module.scss";

import {renderDocument} from "@/components/xmlRenderer";
import {blogRenderComponents} from "@/components/xmlRenderer/blogComponents";
import {CodeTabContextProvider} from "@/components/code/tabs";

type PageParams = {
  slug: string;
};

type PageProps = BlogPostData & {
  slug: string;
};

export default function BlogPage({post, nav, slug}: PageProps) {
  return (
    <MainLayout className={styles.page}>
      <MetaTags
        title={post.title!}
        siteTitle="EdgeDB Blog"
        description={post.description!}
        imagePath={post.leadImage!.path + ".jpg"}
        relPath={`/blog/${slug}`}
      />
      <div className="globalPageWrapper" key={post.id}>
        <BlogToC headers={post.headers} postTitle={post.title!} />
        <div className={styles.pageContent}>
          <div className={styles.postHeader}>
            <div className={styles.publishedOn}>
              {post.publishedOnFormatted}
            </div>
            <h1>{post.title}</h1>
            <PostAuthors authors={post.authors} className={styles.authors} />
            <LazyImage
              className={styles.leadImage}
              url={post.leadImage!.path}
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
          </div>
          <div className={styles.postContent}>
            <CodeTabContextProvider>
              {renderDocument(post.document, styles, blogRenderComponents)}
            </CodeTabContextProvider>
          </div>
        </div>
        <FooterNav
          className={styles.postFooter}
          nav={nav}
          backButton={{
            url: "/blog",
            title: "All Blog Posts",
          }}
        />
      </div>
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
