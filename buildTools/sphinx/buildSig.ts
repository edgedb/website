import {Logger} from "../logger";
import {XMLNode} from "../xmlutils";

export function buildSig(
  objtype: string,
  domain: string,
  node: XMLNode,
  logger: Logger = console
): [string, string | null, string | null] {
  if (objtype === "describe") {
    return [node.getAllText(), null, null];
  }

  if (domain !== "py" && domain !== "js" && domain !== "dn") {
    logger.warn(
      'cannot render block signature: unknown sphinx domain "' + domain + '"',
      node
    );
  }

  let name = node.attrs.fullname ?? "";
  const params = node.lookupAllChildren("desc_parameter");
  const anno = node.lookupAllChildren("desc_annotation");
  const returns = node.lookupAllChildren("desc_returns");
  const ext = node.lookupChild("desc_type");

  const annoText = anno.length ? anno[0].getAllText().trim() : null;

  const outParams = params.map((p) => p.getAllText()).join(", ");

  let returnsText = "";
  if (returns.length) {
    returnsText = returns[0].getAllText().trim();
    switch (domain) {
      case "py":
        returnsText = " -> " + returnsText;
        break;
      case "js":
      default:
        returnsText = ": " + returnsText;
    }
  }

  if ((objtype !== "class" && objtype !== "attribute") || outParams) {
    name += "(" + outParams + ")" + returnsText;
  }

  if (objtype === "class" && domain === "js" && ext) {
    let mro: string[] = [];
    for (let stype of ext.lookupAllChildren("desc_type")) {
      mro.push(stype.getAllText());
    }
    name += " extends " + mro.join(", ");
  }
  return [name, annoText, node.attrs.fullname ?? ""];
}
