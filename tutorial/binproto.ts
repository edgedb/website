import {_CodecsRegistry, _plugJSBI, _ICodec} from "edgedb";

import {Buffer} from "buffer";

import {EdgeDBSet, decode as _decode} from "@edgedb/common/decodeRawBuffer";

const REGISTRY = new _CodecsRegistry();

REGISTRY.setCustomCodecs({
  decimal_string: true,
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
      Buffer.from(typeDescB64, "base64"),
      Buffer.from(inDataB64, "base64"),
      protocolVersion
    ) ?? (([] as any) as EdgeDBSet);

  return [data, data._codec];
}
