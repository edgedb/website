module.exports = [
  {
    source: "/guides/cheatsheet/:path*",
    destination: "/database/cheatsheets/:path*",
    permanent: true,
  },
  {
    source: "/guides/ai/:path*",
    destination: "/ai/:path*",
    permanent: true,
  },
];
