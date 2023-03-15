import * as z from "zod";

import {InspectorState} from "@edgedb/inspector/v2/state";

const CellResultAPIValiator = z.union([
  z.object({
    kind: z.literal("data"),
    data: z.union([
      // old proto, soon to be removed
      z.tuple([z.string(), z.string(), z.string()]),

      // new proto
      z.tuple([z.string(), z.string(), z.string(), z.string()]),
    ]),
  }),
  z.object({
    kind: z.literal("error"),
    error: z.tuple([z.string(), z.string(), z.record(z.string())]),
  }),
  z.object({
    kind: z.literal("skipped"),
  }),
]);

export const CellResultsAPIValidator = z.union([
  z.object({
    kind: z.literal("error"),
    error: z.object({
      message: z.string(),
      type: z.string(),
    }),
  }),
  z.object({
    kind: z.literal("results"),
    results: z.array(CellResultAPIValiator).nonempty(),
  }),
]);

const CellTextValidator = z.object({
  kind: z.literal("text"),
  text: z.string(),
});

const CellEdgeQLValidator = z.object({
  kind: z.literal("edgeql"),
  text: z.string(),
  expectError: z.boolean().optional(),
});

export const CellsValidator = z.union([
  CellTextValidator,
  CellEdgeQLValidator,
]);

export const SectionValidator = z.object({
  title: z.string(),
  slug: z.string(),
  categories: z
    .array(
      z.object({
        category: z.string(),
        slug: z.string(),
        pages: z
          .array(
            z.object({
              title: z.string(),
              slug: z.string(),
              ref: z.string().optional(),
              cells: z.array(CellsValidator).nonempty(),
            })
          )
          .nonempty(),
      })
    )
    .nonempty(),
});

export type EvaledResultData = z.TypeOf<typeof CellResultAPIValiator>;
export type TutorialSectionStaticData = z.TypeOf<typeof SectionValidator>;

export interface TutorialStaticData {
  sections: TutorialSectionStaticData[];
  prefetchedResults: Record<string, EvaledResultData[]>;
  protocolVersion: [number, number] | null;
}

export type CellKind = typeof CellsValidator._type.kind;

export type CellResultError = {
  kind: "error";
  error: [string, string, {[key: string]: string}];
  mode: "binary" | "json";
};

export type CellResultData = {
  kind: "data";
  id: number;
  state: InspectorState;
  status: string;
  input: [string, string, string, string?];
};

export type CellResult = CellResultError | CellResultData | null;

export interface CodeCellState {
  readonly id: number;
  readonly kind: "edgeql";
  mode: "binary" | "json";
  text: string;
  readonly initialText: string;
  result: CellResult;
  resultOutdated: boolean;
  errorInCell: {id: number; num: number} | null;
}

export type ParsedMarkdown = (
  | string
  | (string | {html: string; href: string})[]
)[];

interface TextCellState {
  readonly id: number;
  readonly kind: "text";
  readonly content: string | ParsedMarkdown;
}

export type CellState = CodeCellState | TextCellState;

export interface PageState {
  path: string;
  title: string;
  slug: string;
  cells: number[];
  prefetchedResults: EvaledResultData[] | null;
}

export interface CategoryState {
  category: string;
  slug: string;
  pages: string[];
}

export interface SectionState {
  title: string;
  slug: string;
  categories: Map<string, CategoryState>;
}

export interface State {
  readonly sections: Map<string, SectionState>;
  readonly pages: Map<string, PageState>;
  cells: Map<number, CellState>;
  running: boolean;
  exception: string | null;
  protocolVersion: [number, number] | null;
  readonly defaultMode: "binary" | "json";
}

export interface NextPrevPage {
  path: string;
  categoryTitle?: string;
}
