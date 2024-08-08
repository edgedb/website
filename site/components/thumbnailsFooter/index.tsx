import Link from "next/link";
import {BlogPost} from "dataBuild/interfaces";
import LazyImage from "@edgedb-site/shared/components/lazyImage";
import {ArrowUpIcon} from "../icons";
import styles from "./thumbnailsFooter.module.scss";

interface ThumbnailsFooterProps {
  posts: BlogPost[];
}

const ThumbnailsFooter = ({posts}: ThumbnailsFooterProps) => (
  <div className={styles.container}>
    <h3 className={styles.title}>CHECK THE OTHER POSTS</h3>
    <div className={styles.posts}>
      {posts.map((post) => (
        <Link href={post.slug || ""} key={post.id}>
          <div>
            <LazyImage
              className={styles.postImage}
              url={post.leadImage!.path}
              width={post.leadImage!.width}
              height={post.leadImage!.height}
              thumbnail={post.leadImage!.thumbnail}
            />
            <p className={styles.postTitle}>{post.title}</p>
          </div>
        </Link>
      ))}
    </div>
    <Link href="/blog" className={styles.button}>
      <ArrowUpIcon />
      ALL BLOG POSTS
    </Link>
  </div>
);

export default ThumbnailsFooter;
