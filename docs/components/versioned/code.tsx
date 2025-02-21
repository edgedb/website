"use client";

import { CodeRenderProps } from "@edgedb-site/shared/xmlRenderer/baseComponents";
import { Code, CodeProps } from "@edgedb-site/shared/components/code";
import { useDocVersion } from "@/hooks/docVersion";

export interface VersionedCodeProps extends Omit<CodeProps, "code"> {
  code: { default: string; [version: string]: string };
}

export interface VersionedCodeRenderProps
  extends Omit<CodeRenderProps, "code"> {
  code: { default: string; [version: string]: string };
}

export function VersionedCode({ code: _code, ...props }: VersionedCodeProps) {
  let code: string;
  const version = useDocVersion()?.version;
  const { default: def, ..._versions } = _code;
  code = def;
  const versions = [...Object.entries(_versions)].sort((a, b) =>
    a[0] > b[0] ? 1 : -1
  );
  for (const [ver, verCode] of versions) {
    if (version < ver) {
      code = verCode;
      break;
    }
  }

  return <Code code={code} {...props} />;
}
