import path from "path";
import fs from "fs-extra";

import {PyTuple} from "@edgedb-site/build-tools/steps";
import {getBuildDir} from "@edgedb-site/build-tools/utils";
import {getCacheItem} from "@edgedb-site/build-tools/caching";

export const getIntersphinxConfig = async () => {
  const filePath = path.resolve(
    getBuildDir(),
    "_intersphinx/docs/objects.inv"
  );
  const data = await getCacheItem("docs-intersphinx-objects-inv", true);
  if (data == null) {
    throw new Error(
      "failed to find objects.inv file from docs build, " +
        "ensure docs build has previously been run"
    );
  }
  await fs.outputFile(filePath, data);
  return {
    intersphinx_mapping: {
      docs: new PyTuple(["https://docs.edgedb.com/", filePath]),
    },
  };
};
