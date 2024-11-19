import { DocsNavItem } from "@/dataSources/docs/interfaces";
import { getSourceData } from "../utils";
import linkRemapping from "@/linkRemapping";
import { remapLink } from "@edgedb-site/build-tools/xmlRenderer/remapLink";

export interface DocsNavTreeItem {
  parent?: DocsNavTreeItem;
  title: string;
  uri: string;
  external: boolean;
  children?: DocsNavTreeItem[];
  previous?: DocsNavTreeItem;
  next?: DocsNavTreeItem;
  introPage?: string;
  versionAdded?: string;
  versioned?: boolean;
  noIndexPage: boolean;
}

export type UrlMapping = Map<string, DocsNavTreeItem>;

export function buildNavTree(
  navTree: DocsNavItem[],
  prefix: string,
  stripSection: boolean
) {
  const urlMapping: UrlMapping = new Map();
  const flattenedTree: DocsNavTreeItem[] = [];

  const finalNavTree = navTree
    .map((treeItem) =>
      _walkTree(treeItem, { urlMapping, flattenedTree, prefix, stripSection })
    )
    .filter((item) => item != null) as DocsNavTreeItem[];

  for (const i of flattenedTree.keys()) {
    const item = flattenedTree[i];
    item.previous = flattenedTree[i - 1];
    item.next = flattenedTree[i + 1];
  }

  return {
    urlMapping,
    navTree: finalNavTree,
  };
}

function _walkTree(
  treeItem: DocsNavItem,
  params: {
    parent?: DocsNavTreeItem;
    urlMapping: UrlMapping;
    flattenedTree: DocsNavTreeItem[];
    prefix: string;
    stripSection: boolean;
  }
): DocsNavTreeItem | null {
  if (!treeItem.uri) {
    return null;
  }

  const externalLink = treeItem.type === "external";

  let uri: string;
  if (externalLink) {
    uri = treeItem.uri;
  } else {
    uri = treeItem.uri.replace(/\/index$/, "");
    if (params.stripSection) {
      uri = uri.split("/").slice(1).join("/");
    }
    uri =
      `${params.prefix}/${uri}`
        .replace(/\/\//g, "/")
        .replace(/\/.+\/\.\.\//, "/")
        .replace(/\/$/, "") || "/";
  }

  const item: DocsNavTreeItem = {
    parent: params.parent,
    title: treeItem.title,
    uri: uri,
    external: externalLink,
    introPage: treeItem.introPage,
    versionAdded: treeItem.versionAdded,
    versioned: treeItem.versioned,
    noIndexPage: treeItem.emptyIndexPage === true,
  };

  if (!externalLink) {
    params.flattenedTree.push(item);
    params.urlMapping.set(uri, item);
  }

  item.children = treeItem.children
    ?.filter((child) => !child.anchor)
    .map((child) => {
      return _walkTree(child, {
        ...params,
        parent: item,
      });
    })
    .filter((item) => item != null) as DocsNavTreeItem[];

  return item;
}

export async function getDocsNavData(
  prefix: string,
  root: string,
  stripSection: boolean,
  ...sections: string[]
) {
  const data = (await getSourceData(["docs", "nav"])) as DocsNavItem[];

  const sectionsData: DocsNavItem[] = [];
  for (const section of sections) {
    const sectionData = data.find(
      (navItem) => navItem.uri === `${section}/index`
    );

    if (!sectionData) {
      throw new Error(`no nav data found for section: ${section}`);
    }

    sectionsData.push(sectionData);
  }

  return buildNavTree(
    [
      { type: "page", title: "Overview", uri: root },
      ...(sectionsData.length === 1 ? sectionsData[0].children! : sectionsData),
    ],
    prefix,
    stripSection
  );
}

export type DocsBreadcrumbs = {
  [path: string]: {
    title: string;
    children: DocsBreadcrumbs | null;
  };
};

export async function getDocsBreadcrumbs() {
  const data = (await getSourceData(["docs", "nav"])) as DocsNavItem[];

  function walk(items: DocsNavItem[], parentPath: string): DocsBreadcrumbs {
    const breadcrumbs: DocsBreadcrumbs = {};
    for (const item of items) {
      if (!item.uri || item.type === "external") {
        continue;
      }

      const path = remapLink(`/${item.uri}`, linkRemapping);
      if (!path.startsWith(parentPath)) {
        throw new Error(
          `child breadcrumb item path: '${path}' does not start with parent path: '${parentPath}'`
        );
      }
      breadcrumbs[path.slice(parentPath.length)] = {
        title: item.title,
        children: item.children
          ? walk(
              item.children?.filter((child) => !child.anchor),
              path
            )
          : null,
      };
    }

    return breadcrumbs;
  }

  return walk(data, "");
}
