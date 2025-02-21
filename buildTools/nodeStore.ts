export class NodeStore<T extends {id: string}> {
  public nodes = new Map<string, T>();

  getNode(id: string) {
    return this.nodes.get(id);
  }
  getAllNodes() {
    return [...this.nodes.values()];
  }
  createNode(node: T) {
    this.nodes.set(node.id, node);
  }
  deleteNode(id: string) {
    this.nodes.delete(id);
  }
}
