export enum RenderComponentType {
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
  VersionedCode,
  VersionedHeaderLink,
  VersionedLink,
  VersionedBlock,
  VersionedNote,
  VersionedContentReplace,

  // blog
  BlogLocalLink,
  BlogChart,
  GithubButton,
  BlogGallery,

  // easyedb
  EasyEDBQuiz,
}

export type WithStyles = { styles?: string[] };

export interface RenderNode {
  type: string | RenderComponentType;
  props?: {
    [key: string]: any;
  } & WithStyles;
  children?: (RenderNode | string)[] | null;
}

export type PackedRenderNode = [
  string | RenderComponentType,
  {
    styles?: string[];
    [key: string]: any;
  },
  (PackedRenderNode | string)[]
];
