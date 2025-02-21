export interface DocsNavItem {
  type: "section" | "page" | "external";
  title: string;
  uri?: string;
  anchor?: string;
  children?: DocsNavItem[];
  introPage?: string;
  versionAdded?: string;
  versioned?: boolean;
  emptyIndexPage?: boolean;
}
