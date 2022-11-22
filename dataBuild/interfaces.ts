import type {XMLNode} from "@edgedb/site-build-tools/xmlutils";
import type {Header} from "./xmlRenderer";
import type {PackedRenderNode} from "./xmlRenderer/interfaces";

interface DocVersion {
  id: string;
  label: string;
  branch: string;
  tag?: string;
}

export interface DocVersionsConfig {
  versions: [DocVersion, ...DocVersion[]];
  drivers: {
    python: DocVersion;
    js: DocVersion;
  };
}

export interface BuildConfig {
  repoPaths: {
    edgedb: string;
    python: string;
    js: string;
    go: string;
    dart: string;
    easyedb: string;
    dotnet: string;
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
}

export interface DocsDocument {
  id: string;
  headers: Header[];
  document: PackedRenderNode;
  metadata: string;
  index?: {indexBoost?: number; blocks: IndexBlock[]};
  title?: string;
}

export interface BlogAuthor {
  id: string;
  key: string;
  name: string;
  email?: string;
  twitter?: string;
  github?: string;
  avatarUrl?: string;
}

export interface ImageInfo {
  filename: string;
  path: string;
  width: number;
  height: number;
  thumbnail: string;
}

export interface BlogPost {
  id: string;
  basename: string;
  headers: Header[];
  document: PackedRenderNode;
  authors: BlogAuthor[];
  guid?: string;
  localResources: any;
  leadImage?: ImageInfo;
  slug?: string;
  title?: string;
  publishedOn?: string;
  description?: string;
}

export interface BookChapter {
  id: string;
  chapterNo: number;
  chapterName: string;
  title: string;
  headers: Header[];
  firstParagraph: string;
  document: PackedRenderNode;
  index: {blocks: IndexBlock[]};
  leadImage: ImageInfo | null;
  tags: string[];
}

export interface QuizAnswers {
  id: string;
  document: XMLNode;
}
