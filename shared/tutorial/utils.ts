export function queryWrap(mode: "binary" | "json", query: string): string {
  if (mode === "json") {
    return `SELECT <json>(\n${query.replace(/;*$/, "")}\n)`;
  }
  return query;
}

// This implements node-fetch timeout.
export async function fetchWithTimeout(
  resource: RequestInfo | URL,
  options: any
) {
  const {timeout} = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);

  return response;
}
