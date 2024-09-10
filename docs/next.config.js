/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return require("./redirects.js");
  },
  headers: async () => [
    {
      source: "/_next/static/indexes/:index",
      headers: [
        { key: "Content-Encoding", value: "gzip" },
        { key: "Content-Type", value: "application/json" },
      ],
    },
  ],
  webpack: (config, { isServer, dev }) => {
    config.module.rules.push({
      test: /\.jolrindex$/,
      type: "asset/resource",
      generator: {
        filename: "static/indexes/[name]-[contenthash][ext]",
        publicPath: "/_next/",
      },
    });

    return config;
  },
};

module.exports = nextConfig;
