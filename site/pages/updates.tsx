import {GetStaticProps} from "next";
import {getAllUpdatePosts, type UpdatePostsData} from "dataSources/updates";
import {CodeTabContextProvider} from "@edgedb-site/shared/components/code/tabs";
import {renderDocument} from "@edgedb-site/shared/xmlRenderer";
import baseStyles from "@edgedb-site/shared/xmlRenderer/base.module.scss";
import {HeaderLinkIcon} from "@edgedb-site/shared/components/headerLink/icons";
import {
  blogReactComponents,
  blogRenderComponents,
} from "@/components/xmlRenderer/blogComponents";
import MainLayout from "@/components/layouts/main";
import MetaTags from "@/components/metatags";
import UpdatesToC from "@/components/updatesTOC";
import cn from "@edgedb/common/utils/classNames";
import styles from "@/styles/blogPost.module.scss";

interface PageProps {
  posts: UpdatePostsData;
}

const UpdatesPage = ({posts}: PageProps) => {
  const tocHeaders = posts.map((post) => ({
    title: post.publishedOn,
    id: post.publishedOnHref!,
  }));

  return (
    <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
      <MetaTags
        title="Updates"
        description={`Here you can find chronological EdgeDB updates and announcements.`}
        relPath="/updates"
      />
      <div className="globalPageWrapperBlog">
        <UpdatesToC headers={tocHeaders} />
        <div className={styles.updatesContent} data-theme="dark">
          <CodeTabContextProvider>
            {posts.map((post) => (
              <div key={post.id} id={post.publishedOnHref}>
                <div
                  className={styles.section}
                  id={post.titleHref}
                  data-section-id={post.publishedOnHref}
                >
                  <div className={styles.postHeader}>
                    <span className={styles.publishedOn}>
                      {post.publishedOn}
                    </span>
                    <h1 className={styles.updatePostHeader}>
                      {post.title}
                      <span className={styles.popup}>
                        <a href={`#${post.titleHref || post.publishedOnHref}`}>
                          <HeaderLinkIcon />
                        </a>
                      </span>
                    </h1>
                  </div>
                  <div
                    className={cn(
                      styles.postContent,
                      styles.updatesPostContent
                    )}
                  >
                    {renderDocument(
                      post.document,
                      styles,
                      blogRenderComponents,
                      blogReactComponents,
                      baseStyles
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CodeTabContextProvider>
        </div>
      </div>
    </MainLayout>
  );
};

export default UpdatesPage;

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  return {
    props: {
      posts: await getAllUpdatePosts(),
    },
  };
};
