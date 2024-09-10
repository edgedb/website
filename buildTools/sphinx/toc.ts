import {XMLNode} from "../xmlutils";

export class TocExtractor {
  public _caption: string | null;
  public _stack: any[];

  constructor() {
    this._caption = null;
    this._stack = [{children: []}];
  }

  get _stack_top() {
    return this._stack[this._stack.length - 1];
  }

  visitGeneric(node: XMLNode) {
    for (let child of node.children_no_text) {
      if (child.name == "list_item") {
        this.visitListItem(child);
      } else if (child.name == "caption") {
        this._caption = child.getAllText();
      } else {
        this.visitGeneric(child);
      }
    }
  }

  visitListItem(node: XMLNode) {
    let children = node.children_no_text;
    if (children.length == 1) {
      if (
        children[0].name != "compact_paragraph" ||
        children[0].children_no_text.length != 1 ||
        children[0].children_no_text[0].name != "reference"
      ) {
        throw "ExtractToc: <list_item> structure";
      }
      /* regular node */
      let ref = children[0].children_no_text[0];
      let el: {[key: string]: string} = {
        title: ref.getAllText(),
      };
      if (ref.attrs.anchorname) {
        el.anchor = ref.attrs.anchorname;
      } else {
        el.uri = ref.attrs.refuri ?? "";
      }
      this._stack_top.children.push(el);
    } else {
      if (
        children.length != 2 ||
        children[0].name != "compact_paragraph" ||
        children[0].children_no_text.length != 1 ||
        children[0].children_no_text[0].name != "reference" ||
        children[1].name != "bullet_list"
      ) {
        throw "ExtractToc: unexpected level-defining <list_item> structure";
      }

      let titleref = children[0].children_no_text[0];
      let subtree: {[key: string]: any} = {
        title: titleref.getAllText(),
        children: [],
      };
      if (titleref.attrs.anchorname) {
        subtree.anchor = titleref.attrs.anchorname;
      } else {
        subtree.uri = titleref.attrs.refuri;
      }

      this._stack_top.children.push(subtree);
      this._stack.push(subtree);
      this.visitGeneric(children[1]);
      this._stack.pop();
    }
  }

  static _fixUp(toc_node: any) {
    let hasNestedPages = false;

    if (toc_node.children) {
      for (let child of toc_node.children) {
        this._fixUp(child);
        if (child.uri) {
          hasNestedPages = true;
        }
      }
    }

    toc_node.type = hasNestedPages
      ? "section"
      : toc_node.uri && /^https?:\/\//.test(toc_node.uri)
      ? "external"
      : "page";

    if (
      toc_node.uri &&
      toc_node.uri.endsWith("/__toc__") &&
      toc_node.type == "section" &&
      toc_node.children &&
      toc_node.children.length &&
      toc_node.children[0].uri
    ) {
      toc_node.uri = toc_node.children[0].uri;
    }

    if (
      toc_node.type == "page" &&
      toc_node.children &&
      toc_node.children.length < 2
    ) {
      delete toc_node.children;
    }

    return toc_node;
  }

  static extract(node: XMLNode) {
    let e = new this();
    e.visitGeneric(node);
    let tree = this._fixUp(e._stack[0]).children;
    if (e._caption) {
      tree.caption = e._caption;
    }
    return tree;
  }
}
