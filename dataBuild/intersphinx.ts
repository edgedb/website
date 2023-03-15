import path from "path";

import {PyTuple} from "@edgedb/site-build-tools/steps";
import {getBuildDir} from "@edgedb/site-build-tools/utils";

export const intersphinxConfig = {
  intersphinx_mapping: {
    docs: new PyTuple([
      "/docs",
      path.resolve(getBuildDir(), "_xml/docs/objects.inv"),
    ]),
  },
};
