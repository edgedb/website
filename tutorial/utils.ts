export function queryWrap(mode: "binary" | "json", query: string): string {
  if (mode === "json") {
    return `SELECT <json>(\n${query.replace(/;*$/, "")}\n)`;
  }
  return query;
}
