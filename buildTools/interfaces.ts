export interface BuildConfig {
  repoPaths: {
    edgedb: string;
    python: string;
    js: string;
    go: string;
    dart: string;
    easyedb: string;
    dotnet: string;
    java: string;
    elixir: string;
  };
  sphinxPath?: string;
}

export interface IndexBlock {
  target?: string | null;
  type: string;
  relname: string;
  name?: string | null;
  title?: string | null;
  signature?: string | null;
  summary?: string | null;
  content?: string | null;
  index?: string | null;
  version?: string | null;
}
