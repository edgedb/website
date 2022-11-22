import {createContext} from "react";

import versionConfig from "docVersions.config";

export const DocVersionContext = createContext(versionConfig.versions[0].id);
