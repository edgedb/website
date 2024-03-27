import Head from "next/head";

interface MetaTagsProps {
  title: string;
  description: string;
  imagePath?: string;
  relPath: string;
  twitterAuthor?: string;
  twitterTitle?: string;
  siteTitle?: string | null;
}

// VERCEL_URL will point to a random domain under *.vercel.app in
// production, so guard it with a check of VERCEL_ENV.
const baseUrl =
  process.env.NEXT_PUBLIC_VERCEL_ENV !== "production"
    ? process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "https://www.edgedb.com"
    : "https://www.edgedb.com";

export default function MetaTags(props: MetaTagsProps) {
  const imagePath = props.imagePath || "/logos/edgedb_twitter_card.png";
  let imageUrl =
    baseUrl.replace(/\/+$/g, "") + "/" + imagePath.replace(/^\/+/g, "");
  if (!/\.\w{1,4}$/.test(imageUrl)) {
    imageUrl += ".webp";
  }

  let title = `${props.title}`;
  if (props.siteTitle !== null) {
    title = `${title} | ${props.siteTitle || "EdgeDB"}`;
  }
  const url = `${baseUrl}${props.relPath}`;

  const metaTags = {
    description: props.description.replace(/\s+/, " "),
    "og:title": title,
    "og:type": "website",
    "og:description": props.description.replace(/\s+/, " "),
    "og:image": imageUrl,
    "og:url": url,
  };

  const twitterTags = {
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": props.description,
    "twitter:image": imageUrl,
    "twitter:image:alt": props.description,
    "twitter:site": "@edgedatabase",
    "twitter:author": props.twitterAuthor ? props.twitterAuthor : null,
  };

  return (
    <Head>
      <title>{title}</title>
      <link rel="canonical" href={url} />
      <link
        rel="alternate"
        type="application/rss+xml"
        title="EdgeDB Blog"
        href="https://www.edgedb.com/rss.xml"
      />

      {Object.entries(metaTags)
        .filter(([_, value]) => !!value)
        .map(([key, value]) => (
          <meta
            key={key}
            name={key}
            property={key}
            content={value as string}
          />
        ))}
      {Object.entries(twitterTags)
        .filter(([_, value]) => !!value)
        .map(([key, value]) => (
          <meta key={key} name={key} content={value as string} />
        ))}
    </Head>
  );
}
