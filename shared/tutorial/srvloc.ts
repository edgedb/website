export function getEdgeDBServerURL(): string {
  const srv = process.env.NEXT_PUBLIC_EDGEDB_SERVER || "http://localhost:5656";
  const db = process.env.NEXT_PUBLIC_EDGEDB_TUTORIAL_DB || "tutorial";
  return srv.replace(/\/+$/, "") + "/db/" + db + "/notebook";
}
