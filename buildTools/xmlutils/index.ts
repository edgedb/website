import xmldom from "xmldom";

export type CompressedXML = [any[], any];

export function parseXMLString(xmlString: string) {
  return new xmldom.DOMParser().parseFromString(xmlString);
}

export function compressXml(xmlsource: string | Document): CompressedXML {
  let attrs = new Set();
  let tags = new Set();
  let attrsMapping = new Map();
  let tagsMapping = new Map();
  let namesList: any[] = [];

  function captureNames(node: any) {
    if (node.nodeType == 1) {
      // element
      if (node.attributes) {
        for (let i = 0; i < node.attributes.length; i++) {
          let attr = node.attributes[i];
          attrs.add(attr.nodeName);
        }
      }
      tags.add(node.nodeName);
    }

    if (node.childNodes) {
      for (let i = 0; i < node.childNodes.length; i++) {
        let child = node.childNodes[i];
        captureNames(child);
      }
    }
  }

  function mapNames() {
    namesList.push(0);

    for (let attr of attrs) {
      namesList.push(attr);
      attrsMapping.set(attr, namesList.length - 1);
    }

    namesList[0] = namesList.length - 1;

    for (let tag of tags) {
      namesList.push(tag);
      tagsMapping.set(tag, namesList.length - 1);
    }
  }

  function compress(node: any): any {
    let el = [];

    if (node.nodeType == 9) {
      // document
      for (let i = 0; i < node.childNodes.length; i++) {
        if (node.childNodes[i].nodeType == 1) {
          node = node.childNodes[i];
          break;
        }
      }
    }

    if (node.nodeType == 1) {
      // element
      if (node.attributes) {
        for (let i = 0; i < node.attributes.length; i++) {
          let attr = node.attributes[i];
          el.push(attrsMapping.get(attr.nodeName));
          el.push(attr.nodeValue);
        }
      }
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          let child = node.childNodes[i];
          let res = compress(child);
          if (!res) {
            continue;
          }
          el.push(...res);
        }
      }
      return [tagsMapping.get(node.nodeName), el];
    } else if (node.nodeType == 3) {
      // text
      if (!node.nodeValue) {
        return;
      }
      let text = node.nodeValue;
      if (!text.trim()) {
        return [-2, 0];
      } else {
        return [-1, text];
      }
    }
  }

  let root =
    typeof xmlsource === "string" ? parseXMLString(xmlsource) : xmlsource;
  captureNames(root);
  mapNames();

  return [namesList, compress(root)];
}

export class XMLNode {
  private _name: string;
  private _attrs: { [key: string]: string | undefined };
  private _children: (XMLNode | string)[];
  private _parent?: XMLNode;

  constructor(
    name: string,
    attrs: { [key: string]: string },
    children: (XMLNode | string)[]
  ) {
    this._name = name;
    this._attrs = attrs;
    this._children = children;
    for (let child of children) {
      if (child instanceof XMLNode) {
        child._parent = this;
      }
    }
  }

  get parent(): XMLNode | null {
    return this._parent || null;
  }

  get name() {
    return this._name;
  }

  get attrs() {
    return this._attrs;
  }

  get children() {
    return this._children;
  }

  get children_no_text(): XMLNode[] {
    let nodes = [];
    for (let child of this._children) {
      if (child instanceof XMLNode) {
        nodes.push(child);
      }
    }
    return nodes;
  }

  get childIndex() {
    return this._parent?._children.indexOf(this);
  }

  getNextSibling() {
    let i = this.childIndex;
    if (i === undefined || i === -1) {
      return undefined;
    }
    return this._parent?._children[i + 1];
  }

  removeChild(child: XMLNode) {
    const i = this._children.indexOf(child);
    if (i !== -1) {
      this._children.splice(i, 1);
    } else {
      throw new Error("Child node not found");
    }
  }

  replaceChild(oldChild: XMLNode, newChild: XMLNode) {
    const i = this._children.indexOf(oldChild);
    if (i !== -1) {
      if (newChild instanceof XMLNode) {
        newChild._parent = this;
      }
      this._children.splice(i, 1, newChild);
    } else {
      throw new Error("Child node not found");
    }
  }

  removeTextChildrenFromIndex(startIndex: number) {
    let i = startIndex;
    for (; i < this._children.length; i++) {
      if (typeof this._children[i] !== "string") {
        break;
      }
    }
    this._children.splice(startIndex, i - startIndex);
  }

  lookupChildren(name: string): XMLNode[] {
    let found = [];
    for (let child of this._children) {
      if (child instanceof XMLNode && child.name == name) {
        found.push(child);
      }
    }
    return found;
  }

  lookupChild(name: string): XMLNode | undefined {
    for (let child of this._children) {
      if (child instanceof XMLNode && child.name == name) {
        return child;
      }
    }
  }

  lookupAllChildren(name: string): XMLNode[] {
    let found: XMLNode[] = [];

    function onNode(node: XMLNode | string) {
      if (node instanceof XMLNode && node.name == name) {
        found.push(node);
      }
    }

    this.walk(onNode);
    return found;
  }

  getText(pre = false) {
    let buf: string[] = [];
    for (let child of this._children) {
      if (typeof child == "string") {
        buf.push(child);
      }
    }
    if (pre) {
      return buf.join("");
    } else {
      return buf.join(" ").replace(/\s+/g, " ");
    }
  }

  getAllText(pre = false) {
    let buf: string[] = [];
    this.walk((c) => {
      if (typeof c == "string") {
        buf.push(c);
      }
    });
    if (pre) {
      return buf.join("");
    } else {
      return buf.join(" ").replace(/\s+/g, " ");
    }
  }

  walk(cb: (child: XMLNode | string) => void) {
    for (let child of this._children) {
      cb(child);
      if (child instanceof XMLNode) {
        child.walk(cb);
      }
    }
  }
}

export function decompressXml(lst: CompressedXML) {
  let [serNames, serTags] = lst;
  let tagsIndex = {} as any;
  let attrsIndex = {} as any;

  let tagFrom = serNames[0];
  for (let i = 1; i < serNames.length; i++) {
    let targetIndex = i > tagFrom ? tagsIndex : attrsIndex;
    targetIndex[i] = serNames[i];
  }

  function walk(tagId: any, tagSer: any): XMLNode {
    let tag = tagsIndex[tagId];
    let attrs = {} as any;
    let children = [];

    for (let i = 0; i < tagSer.length; i += 2) {
      let v = tagSer[i],
        nv = tagSer[i + 1];
      if (v != -1 && attrsIndex[v]) {
        attrs[attrsIndex[v]] = nv;
      }
    }

    for (let i = 0; i < tagSer.length; i += 2) {
      let v = tagSer[i],
        nv = tagSer[i + 1];
      if (attrsIndex[v]) {
        continue;
      }

      if (v < 0) {
        /* text node; `!nv` means empty text, so render \n */
        children.push(nv || "\n");
      } else {
        children.push(walk(v, nv));
      }
    }

    return new XMLNode(tag, attrs, children);
  }

  return walk(...(serTags as [any, any]));
}

const stripRefIdsInAttrs = new Set(["ids", "refids", "refuri"]);

export function transformXML(
  xmlsource: string | Document,
  collapseEmptyStrings = true,
  stripRefIds = true
) {
  const visited = new Map<ChildNode, XMLNode>();

  function walk(node: ChildNode): XMLNode | string | null {
    if (visited.has(node)) {
      // A recursion in the XML is possible and if it happens
      // node will crash.
      return visited.get(node)!;
    }

    if (node.nodeType === 1) {
      // element

      const attrs: { [key: string]: any } = {};
      let children: (string | XMLNode)[] = [];

      if ((node as any).attributes) {
        for (const attr of Object.values((node as any).attributes) as any) {
          if (attr.nodeValue !== null && attr.nodeValue !== undefined) {
            attrs[attr.nodeName] =
              stripRefIds && stripRefIdsInAttrs.has(attr.nodeName)
                ? attr.nodeValue.replace(/[<>]/g, "_")
                : attr.nodeValue;
          }
        }
      }
      if (node.childNodes) {
        children = Object.values(node.childNodes)
          .map(walk)
          .filter((node) => node !== null) as (XMLNode | string)[];
      }
      const newNode = new XMLNode(node.nodeName, attrs, children);
      visited.set(node, newNode);
      return newNode;
    } else if (node.nodeType === 3) {
      // text
      if (!node.nodeValue) {
        return null;
      }
      let text = node.nodeValue;
      return collapseEmptyStrings && !text.trim() ? "\n" : text;
    }
    return null;
  }

  const parsedXML =
    typeof xmlsource === "string" ? parseXMLString(xmlsource) : xmlsource;

  const root =
    parsedXML.nodeType === 9 && // document
    Object.values(parsedXML.childNodes).find(
      (childNode) => childNode.nodeType === 1
    );
  if (!root) {
    throw new Error(
      "xmlsource is not a document node containing an element node"
    );
  }

  return walk(root) as XMLNode;
}
