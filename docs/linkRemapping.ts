import type { LinkRemapping } from "@edgedb-site/build-tools/xmlRenderer/remapLink";

const linkRemapping: LinkRemapping = [
  { from: /^\/intro\//, to: "/get-started/" },
  { from: /^\/clients\//, to: "/libraries/" },
  { from: /^\/datamodel\//, to: "/database/datamodel/" },
  { from: /^\/edgeql\//, to: "/database/edgeql/" },
  { from: /^\/stdlib\//, to: "/database/stdlib/" },
  { from: /^\/reference\//, to: "/database/reference/" },
  { from: /^\/cheatsheets\//, to: "/database/cheatsheets/" },
  { from: /\/index$/, to: "" },
];

export default linkRemapping;
