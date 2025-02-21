import { _CodecsRegistry, _plugJSBI, _ICodec } from "edgedb";
import { decodeB64 } from "edgedb/dist/primitives/buffer";

import { EdgeDBSet, decode as _decode } from "@edgedb/common/decodeRawBuffer";

const REGISTRY = new _CodecsRegistry();

REGISTRY.setCustomCodecs({
  int64_bigint: true,
  datetime_localDatetime: true,
  json_string: true,
});

if (typeof BigInt === "undefined") {
  const JSBI = require("jsbi");
  _plugJSBI(JSBI);
}

export function decode(
  typeIdB64: string,
  typeDescB64: string,
  inDataB64: string,
  protocolVersion?: [number, number]
): [any[], _ICodec] {
  const data =
    _decode(
      REGISTRY,
      decodeB64(typeDescB64),
      decodeB64(inDataB64),
      protocolVersion
    ) ?? (([] as any) as EdgeDBSet);

  return [data, data._codec];
}
