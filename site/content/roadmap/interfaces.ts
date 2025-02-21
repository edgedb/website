export interface CodeBlock {
  language: "edgeql" | "sdl" | "edgeql-repl" | "bash" | "graphql" | "python";
  code: string;
}

export interface RoadmapItem {
  title: string;
  // In `post-*` and `planned-*` badges the `*` value will be inserted into
  // the rendered badge as written
  // eg: 'planned-beta 1' will be rendered 'Planned for beta 1'
  badge:
    | "done"
    | "partly"
    | "inprogress"
    | `post-${string}`
    | `planned-${string}`;
  content: JSX.Element;
}

interface SectionItemGroup {
  items: RoadmapItem[];
  // Each item in the codeblocks array is rendered as a separate visual block,
  // the item can itself be a single `CodeBlock` or an array of `CodeBlocks` to
  // allow multiple code snippets with different languages to be rendered in
  // the same visual block
  codeblocks?: (CodeBlock | CodeBlock[])[];
  alignment?: "left" | "below";
}

export interface Section {
  title: string;
  intro?: JSX.Element;
  groups: SectionItemGroup[];
}
