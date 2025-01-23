import _versions from "@/build-cache/docs/versions.json";

const versions: {version: string; tag?: string}[] = _versions;

export const getVersionTag = (versionToCheck: string) =>
  versions.find((version) => version.version === versionToCheck)?.tag;

export const isVersionDev = (versionToCheck: string) =>
  getVersionTag(versionToCheck) === "dev";
