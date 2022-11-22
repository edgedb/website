import {DocsNavItem} from "dataSources/docs/interfaces";

export interface DocsNavTreeItem {
  parent?: DocsNavTreeItem;
  title: string;
  uri: string;
  children?: DocsNavTreeItem[];
  previous?: DocsNavTreeItem;
  next?: DocsNavTreeItem;
  introPage?: string;
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

const _navData = new Map<string, ReturnType<typeof buildNavTree>>();

export function getNavData(versionId: string) {
  if (!_navData.has(versionId)) {
    const navTree = buildNavTree(
      require(`@/build-cache/docs/${versionId}/nav.json`)
    );
    _navData.set(versionId, navTree);
  }
  return _navData.get(versionId)!;
}
