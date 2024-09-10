import * as z from "zod";

import { InspectorState } from "@edgedb/inspector/state";

const CellResultAPIValidator = z.union([
  z.object({
    kind: z.literal("data"),
    data: z.tuple([z.string(), z.string(), z.string(), z.string()]),
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
    results: z.array(CellResultAPIValidator).nonempty(),
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

export type CodeCellData = z.infer<typeof CellEdgeQLValidator>;

export const CellsValidator = z.union([CellTextValidator, CellEdgeQLValidator]);

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

export type EvaledResultData = z.TypeOf<typeof CellResultAPIValidator>;

export type TutorialStaticPageData = {
  [pagePath: string]: {
    relname: string;
    refs: string[];
    slug: string;
    title: string;
    cells: z.infer<typeof CellsValidator>[];
  };
};

export interface TutorialStaticData {
  pages: TutorialStaticPageData;
  prefetchedResults: Record<string, EvaledResultData[]>;
  protocolVersion: [number, number] | null;
}

export type TutorialNavData = {
  [slug: string]: {
    title: string;
    categories: {
      [slug: string]: { title: string; pages: { [slug: string]: string } };
    };
  };
};

export type CellKind = z.infer<typeof CellsValidator>["kind"];

export type CellResultError = {
  kind: "error";
  error: [string, string, { [key: string]: string }];
  mode: "binary" | "json";
};

export type CellResultData = {
  kind: "data";
  id: number;
  state: InspectorState;
  status: string;
  input: [string, string, string, string?];
};

export type CellResult = CellResultError | CellResultData;

export type ParsedMarkdown = (
  | string
  | (string | { html: string; href: string })[]
)[];

export interface NextPrevPage {
  path: string;
  categoryTitle?: string;
}
