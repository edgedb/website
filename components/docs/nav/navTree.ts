import {DocsNavItem} from "dataSources/docs/interfaces";

export interface DocsNavTreeItem {
  parent?: DocsNavTreeItem;
  title: string;
  uri: string;
  children?: DocsNavTreeItem[];
  previous?: DocsNavTreeItem;
  next?: DocsNavTreeItem;
  introPage?: string;
  versionAdded?: string;
}

export type UrlMapping = Map<string, DocsNavTreeItem>;

export function buildNavTree(navTree: DocsNavItem[]) {
  const urlMapping: UrlMapping = new Map();
  const flattenedTree: DocsNavTreeItem[] = [];

  const finalNavTree = navTree.map((treeItem) =>
    _walkTree(treeItem, {urlMapping, flattenedTree})
  );

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
  }
): DocsNavTreeItem {
  const item: DocsNavTreeItem = {
    parent: params.parent,
    title: treeItem.title,
    uri: treeItem.uri!,
    introPage: treeItem.introPage,
    versionAdded: treeItem.versionAdded,
  };

  params.flattenedTree.push(item);
  params.urlMapping.set(item.uri, item);

  item.children = treeItem.children
    ?.filter((child) => !child.anchor)
    .map((child) => {
      return _walkTree(child, {
        parent: item,
        urlMapping: params.urlMapping,
        flattenedTree: params.flattenedTree,
      });
    });

  return item;
}

let _navData: ReturnType<typeof buildNavTree> | null = null;

export function getNavData() {
  if (!_navData) {
    const navTree = buildNavTree(require(`@/build-cache/docs/nav.json`));
    _navData = navTree;
  }
  return _navData!;
}
