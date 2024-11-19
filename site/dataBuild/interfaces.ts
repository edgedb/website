import type {XMLNode} from "@edgedb-site/build-tools/xmlutils";
import type {Header} from "@edgedb-site/build-tools/xmlRenderer";
import type {PackedRenderNode} from "@edgedb-site/build-tools/xmlRenderer/interfaces";

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
  brightness?: number;
  thumbnail: string;
  pathIncludesExt?: boolean;
}

export interface BlogPost {
  id: string;
  basename: string;
  headers: Header[];
  document: PackedRenderNode;
  authors: BlogAuthor[];
  guid?: string;
  recommendations?: string[];
  localResources: any;
  leadImage?: ImageInfo;
  leadImageAlt?: string;
  leadYT?: string;
  slug?: string;
  title?: string;
  publishedOn?: string;
  description?: string;
}

export interface UpdatePost {
  id: string;
  basename: string;
  document: PackedRenderNode;
  title?: string;
  publishedOn?: string;
}
