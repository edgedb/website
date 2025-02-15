module.exports = {
  experimental: {
    externalDir: true,
  },
  images: {
    deviceSizes: [320, 420, 768, 1024, 1440, 1920, 2560],
  },
  async redirects() {
    return require("./redirects.js");
  },
  async rewrites() {
    return [
      {
        source: "/sh",
        destination: "/_install_cli.sh",
      },
      {
        source: "/ps1",
        destination: "/_install_cli.ps1",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/(.*\\.(?:webp|png|jpe?g|svg)$)",
        headers: [{key: "Cache-Control", value: "public, max-age=604800"}],
      },
      {
        source: "/_next/static/indexes/:index",
        headers: [
          {key: "Content-Encoding", value: "gzip"},
          {key: "Content-Type", value: "application/json"},
        ],
      },
      {
        source: "/api/subscribe",
        headers: [
          {key: "Access-Control-Allow-Origin", value: "*"},
          {key: "Access-Control-Allow-Methods", value: "POST"},
        ],
      },
      {
        source: "/latestInfo.json",
        headers: [{key: "Access-Control-Allow-Origin", value: "*"}],
      },
      {
        source: "/(sh|ps1)",
        headers: [{key: "Content-Type", value: "text/plain"}],
      },
    ];
  },
  webpack: (config, {isServer, dev}) => {
    config.module.rules.push(
      {
        test: /(\.html|\.glb|\.jsonfont)$/,
        type: "asset/resource",
        generator: {
          filename: "static/files/[name]-[contenthash][ext]",
          publicPath: "/_next/",
        },
      },
      {
        test: /\.jolrindex$/,
        type: "asset/resource",
        generator: {
          filename: "static/indexes/[name]-[contenthash][ext]",
          publicPath: "/_next/",
        },
      },
      {test: /\.raw\.json$/, type: "asset/source"}
    );

    return config;
  },
};
