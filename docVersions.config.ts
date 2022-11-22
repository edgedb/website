import {DocVersionsConfig} from "./dataBuild/interfaces";

const config: DocVersionsConfig = {
  versions: [{id: "v1.0", label: "1.0", branch: "master", tag: "latest"}],
  drivers: {
    js: {id: "v0.19.0", label: "0.19.x", branch: "master"},
    python: {id: "v0.22.0", label: "0.22.x", branch: "master"},
  },
};

export default config;
