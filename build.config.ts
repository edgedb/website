import { BuildConfig } from "./buildTools/interfaces";

const config: BuildConfig = {
  repoPaths: {
    edgedb: "../.repos/edgedb",
    js: "../.repos/edgedb-js",
    python: "../.repos/edgedb-python",
    go: "../.repos/edgedb-go",
    dart: "../.repos/edgedb-dart",
    dotnet: "../.repos/edgedb-net",
    easyedb: "../.repos/easy-edgedb",
    java: "../.repos/edgedb-java",
    elixir: "../.repos/edgedb-elixir",
  },
  sphinxPath: "../.venv/bin/sphinx-build",
};

export default config;
