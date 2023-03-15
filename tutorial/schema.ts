import {Schema} from "@edgedb/schema-graph";

import {decode} from "./binproto";

import data from "@/build-cache/tutorial/schema-data.json";

export const schemaState = Schema.create();

let schemaLoaded = false;

export async function loadSchema() {
  if (schemaLoaded) {
    return;
  }
  const schemaData = data.data.map(
    (raw) =>
      decode(
        raw[0],
        raw[1],
        raw[2],
        data.protocolVersion as [number, number]
      )[0]
  );
  await schemaState.updateSchema(schemaData[0], [], [], []);
  schemaLoaded = true;
}
