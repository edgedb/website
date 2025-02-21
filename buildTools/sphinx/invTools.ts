import zlib from "zlib";

interface SphinxInvEntry {
  ref: string;
  domain?: string;
  role?: string;
  priority?: number;
  relname: string;
  title?: string;
}

export function buildIntersphinxInv(
  config: { name: string; version: string },
  refs: SphinxInvEntry[]
): Buffer {
  const header = `# Sphinx inventory version 2
# Project: ${config.name}
# Version: ${config.version}
# The remainder of this file is compressed using zlib.\n`;

  const data: string[] = [];
  for (const ref of refs) {
    data.push(
      `${ref.ref} ${ref.domain ?? "std"}:${ref.role ?? "label"} ${
        ref.priority ?? -1
      } ${ref.relname} ${ref.title ?? "-"}`
    );
  }

  return Buffer.concat([
    Buffer.from(header),
    zlib.deflateSync(Buffer.from(data.join("\n")), { level: 9 }),
  ]);
}

export function parseIntersphinxInv(file: Buffer) {
  const lines = file.toString("utf8").split("\n");
  if (
    lines[0] !== "# Sphinx inventory version 2" ||
    !lines[1].startsWith("# Project: ") ||
    !lines[2].startsWith("# Version: ") ||
    lines[3] !== "# The remainder of this file is compressed using zlib."
  ) {
    throw new Error("failed to parse sphinx inv file, invalid header");
  }
  const projectName = lines[1].slice(11);
  const version = lines[2].slice(11);
  const contentBuf = file.subarray(
    Buffer.from(lines.slice(0, 4) + "\n").length
  );

  const content = zlib.inflateSync(contentBuf).toString("utf8");

  const refs: Required<SphinxInvEntry>[] = content
    .split("\n")
    .filter((line) => !!line.trim())
    .map((line, i) => {
      const [match, ref, domain, role, priority, relname, title] =
        line.match(/^(.+) ([^:\s]+):([^\s]+) (-?\d+) ([^\s]*) (.+)$/) ?? [];
      if (!match) {
        throw new Error(`failed to parse sphinx inv file, line ${i} : ${line}`);
      }

      return {
        ref,
        domain,
        role,
        priority: parseInt(priority, 10),
        relname,
        title,
      };
    });

  return {
    name: projectName,
    version,
    refs,
  };
}
