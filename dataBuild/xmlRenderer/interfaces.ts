import type {ComponentRenderNode} from "@/components/xmlRenderer/interfaces";

export enum RenderComponent {
  ReactComponent,

  // base
  NextLink,
  Code,
  CodeTabs,
  HeaderLink,
  Migration,
  LazyImage,

  // docs
  DocIntroIllustration,
  DescBlock,
  DescRef,
  VersionedLink,
  VersionedBlock,

  // blog
  BlogLocalLink,
  BlogChart,
  GithubButton,

  // easyedb
  EasyEDBQuiz,
}

export type WithStyles = {styles?: string[]};

export interface BasicRenderNode {
  type: string;
  props?: {
    [key: string]: any;
  } & WithStyles;
}

export type {ComponentRenderNode};

export type RenderNode = (BasicRenderNode | ComponentRenderNode) & {
  children?: (RenderNode | string)[] | null;
};

export type PackedRenderNode = [
  string | RenderComponent,
  {
    styles?: string[];
    [key: string]: any;
  },
  (PackedRenderNode | string)[]
];
