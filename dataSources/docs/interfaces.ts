export interface DocsNavItem {
  title: string;
  uri?: string;
  anchor?: string;
  children?: DocsNavItem[];
  introPage?: string;
  versionAdded?: string;
}
