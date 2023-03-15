import zlib from "zlib";

export function buildIntersphinxInv(
  config: {name: string; version: string},
  refs: {
    ref: string;
    relname: string;
    title?: string;
  }[]
): Buffer {
  const header = `# Sphinx inventory version 2
# Project: ${config.name}
# Version: ${config.version}
# The remainder of this file is compressed using zlib.\n`;

  const data: string[] = [];
  for (const ref of refs) {
    data.push(`${ref.ref} std:label -1 ${ref.relname} ${ref.title ?? "-"}`);
  }

  return Buffer.concat([
    Buffer.from(header),
    zlib.deflateSync(Buffer.from(data.join("\n")), {level: 9}),
  ]);
}
