import { getDocsBreadcrumbs } from "@/dataSources/docs/nav";

import { Search as SearchClient } from "./clientIndex";

export async function Search() {
  const docsBreadcrumbs = await getDocsBreadcrumbs();

  return <SearchClient docsBreadcrumbs={docsBreadcrumbs} />;
}
