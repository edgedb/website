import type { XMLNode } from "@edgedb-site/build-tools/xmlutils";
import type { Header } from "@edgedb-site/build-tools/xmlRenderer";
import type { PackedRenderNode } from "@edgedb-site/build-tools/xmlRenderer/interfaces";
import type { IndexBlock } from "@edgedb-site/build-tools/interfaces";

export { IndexBlock };

export interface DocVersionsConfig {
  currentStable: string;
}

export interface DocsDocument {
  id: string;
  headers: Header[];
  document: PackedRenderNode;
  metadata: string;
  index?: { indexBoost?: number; blocks: IndexBlock[] };
  title?: string;
  versioning: {
    page?: string;
    anchors?: { [key: string]: string };
  };
}

export interface ImageInfo {
  filename: string;
  path: string;
  width: number;
  height: number;
  thumbnail: string;
}

export interface BookChapter {
  id: string;
  chapterNo: number;
  chapterName: string;
  title: string;
  headers: Header[];
  firstParagraph: string;
  document: PackedRenderNode;
  index: { blocks: IndexBlock[] };
  leadImage: ImageInfo | null;
  tags: string[];
}

export interface QuizAnswers {
  id: string;
  document: XMLNode;
}
