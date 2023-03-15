import fs from "fs-extra";
import {join as pathJoin, relative} from "path";
import {execFile} from "child_process";

import {Pipeline, PipelineStep} from ".";
import {
  watchFiles,
  pathWithoutExt,
  debounce,
  getBuildDir,
  cleanBuildDir,
  runPython,
} from "./utils";

export interface FileInfo {
  path: string;
  relname: string;
}

export function createWatchFilesStep(
  rootDir: string,
  files: string | string[] = "/**/*",
  onFileChange?: (
    info: {
      type: "add" | "change" | "unlink";
      firstRun: boolean;
    } & FileInfo,
    pipeline: Pipeline
  ) => Promise<void>,
  onDone?: () => Promise<void> | void
): PipelineStep {
  let runOnce = false;
  let ready = false;
  let firstRun = true;
  let pendingChangeHandlers = 0;

  return {
    onRun({pipeline, done: _done}) {
      if (runOnce) {
        _done();
        return;
      }

      runOnce = true;
      const done = debounce(async () => {
        pipeline.logger.log("files changed...");
        await onDone?.();
        _done();
      });

      const filesToWatch = (Array.isArray(files)
        ? files
        : [files]
      ).map((glob) => pathJoin(rootDir, glob));

      if (pipeline.watchMode) {
        pipeline.logger.log(`watching files: ${filesToWatch.join(", ")}`);
      }

      const unwatch = watchFiles(
        filesToWatch,
        async (type, path) => {
          if (type === "addDir" || type === "unlinkDir") {
            return;
          }

          if (onFileChange) {
            pendingChangeHandlers += 1;
            onFileChange(
              {
                firstRun,
                type,
                path,
                relname: pathWithoutExt(relative(rootDir, path)),
              },
              pipeline
            ).then(() => {
              pendingChangeHandlers -= 1;
              checkDone();
            });
          } else {
            checkDone();
          }
        },
        () => {
          ready = true;

          if (!pipeline.watchMode) {
            unwatch();
          }

          checkDone();
        }
      );

      async function checkDone() {
        if (!pendingChangeHandlers && ready) {
          if (firstRun) {
            firstRun = false;
            await onDone?.();
            _done();
          } else {
            done();
          }
        }
      }
    },
  };
}

export function createCopyFilesStep(
  fromDir: string,
  toDir: string,
  files: string | string[] = "/**/*",
  onFileChange?: (
    info: {
      type: "add" | "change" | "unlink";
      firstRun: boolean;
    } & FileInfo
  ) => void,
  transform?: (file: Buffer, filepath: string) => Buffer | string
): PipelineStep {
  let copying = false;

  return createWatchFilesStep(
    fromDir,
    files,
    async (info, pipeline) => {
      if (!copying) {
        copying = true;
        pipeline.logger.log("copying files...");
      }

      onFileChange?.(info);

      const outPath = pathJoin(toDir, relative(fromDir, info.path));

      switch (info.type) {
        case "add":
        case "change":
          {
            const file = await fs.readFile(info.path);
            await fs.outputFile(
              outPath,
              transform ? transform(file, info.path) : file
            );
          }
          break;
        case "unlink": {
          await fs.remove(outPath);
        }
      }
    },
    () => {
      copying = false;
    }
  );
}

export class PyTuple {
  constructor(public values: PyValue[]) {}
}

type PyValue =
  | string
  | number
  | boolean
  | null
  | PyTuple
  | PyValue[]
  | {[key: string]: PyValue};

function renderPyValue(val: PyValue): string {
  if (val === null) {
    return "None";
  }
  switch (typeof val) {
    case "boolean":
      return val ? "True" : "False";
    case "number":
      return `${val}`;
    case "string":
      return `'${val.replace(/'/g, `\\'`)}'`;
    case "object":
      if (Array.isArray(val)) {
        return `[\n${val
          .map((item) =>
            renderPyValue(item)
              .split("\n")
              .map((line) => `    ${line}`)
              .join("")
          )
          .join(",\n")}\n]`;
      } else if (val instanceof PyTuple) {
        return `(${val.values.map(renderPyValue).join(", ")})`;
      } else {
        return `{\n    ${Object.entries(val)
          .map(
            ([key, value]) =>
              `'${key.replace(/'/g, `\\'`)}': ${renderPyValue(value)
                .split("\n")
                .map((line) => `    ${line}`)
                .join("")
                .slice(4)}`
          )
          .join(",\n")}\n}`;
      }
  }
}

export function injectConfPy(
  outputDir: string,
  inputDir: string | null,
  conf: {
    [key: string]: PyValue;
  }
): PipelineStep {
  let hasRun = false;

  return {
    async onRun({done, failed}) {
      if (!hasRun) {
        let confFile = "";
        if (inputDir) {
          confFile = await fs.readFile(pathJoin(inputDir, "conf.py"), "utf8");
        }

        for (const [key, value] of Object.entries(conf)) {
          confFile += `\n`;
          if (
            inputDir &&
            typeof value === "object" &&
            !(value instanceof PyTuple)
          ) {
            confFile += `if '${key}' not in locals():
    ${key} = ${Array.isArray(value) ? "[]" : "{}"}\n`;
            confFile += `${key}.${
              Array.isArray(value) ? "extend" : "update"
            }(${renderPyValue(value)})\n`;
          } else {
            confFile += `${key} = ${renderPyValue(value)}\n`;
          }
        }

        await fs.outputFile(pathJoin(outputDir, "conf.py"), confFile);
        hasRun = true;
      }
      done();
    },
  };
}

interface RunSphinxBuildArgs {
  sourceDir: string;
  indexFile?: string;
  outputDir?: string;
  extraArgs?: string[];
  extraEnv?: {[key: string]: string};
  sphinxPath?: string;
  extraExtensions?: string[];
}

export function createRunSphinxBuildStep({
  sourceDir,
  indexFile,
  outputDir,
  extraArgs,
  extraEnv,
  sphinxPath,
  extraExtensions,
}: RunSphinxBuildArgs): PipelineStep {
  const baseArgs = [
    "-b",
    "edge-xml", // xml output
    "-q", // no stdout output
    "-D",
    `master_doc=${indexFile ?? "index"}`,
    ...(extraArgs ?? []),
  ];

  const opts = {
    env: {
      ...process.env,
      EDGEDB_DEBUG_DISABLE_DOCS_EDGEQL_VALIDATION: "1",
      ...(extraEnv ?? {}),
    },
  };

  let firstRun = true;
  let extensions: string[] = [
    "edgedbsite.sphinx_edbxml",
    "edgedbsite.dotnetdomain",
    ...(extraExtensions || []),
  ];

  return {
    async onRun({pipeline, done, failed}) {
      const args = [...baseArgs];

      if (firstRun) {
        args.push("-a"); // write all files
        await cleanBuildDir(["_xml", pipeline.name]);

        /* Check if `conf.py` exists for this documentation.

           If it does -- parse it just the way sphinx parses it itself:
           by using eval. Then print the contents of the 'extensions' entry
           to the stdout (JSON-encoded).

           The reason for these shenanigans is sphinx not having
           any option to "append an extension". It can only override
           extensions with `-D extensions=`.
        */
        const confFn = pathJoin(sourceDir, "conf.py");
        if (
          !(extraArgs && extraArgs.includes("-C")) &&
          fs.pathExistsSync(confFn)
        ) {
          const prog = [
            `import json`,
            `fn = ${JSON.stringify(confFn)}`,
            `ls = {}`,
            `with open(fn, 'rt') as f:`,
            `  exec(f.read(), {}, ls)`,
            `if ls.get('extensions'):`,
            `  print(json.dumps({'ext': ls['extensions']}))`,
            `else:`,
            `  print('{}')`,
          ].join("\n");

          const {stdout} = await runPython(["-c", prog]);

          const exts = JSON.parse(stdout);
          if (exts.ext) {
            extensions.push.apply(extensions, exts.ext);
          }
        }
      }

      // `-Dextensions` must be the first arg, because our
      // own `sphinx_edbxml` extensions defines a custom XML builder,
      // set with `-b edge-xml`.
      args.unshift.apply(args, [`-D`, `extensions=${extensions.join(",")}`]);

      args.push(
        sourceDir,
        outputDir ?? pathJoin(getBuildDir(), "_xml", pipeline.name)
      );

      pipeline.logger.log(`running sphinx-build ${args.join(" ")}`);

      execFile(
        sphinxPath ?? "sphinx-build",
        args,
        opts,
        (err, stdout, stderr) => {
          err = err || findRefWarnings(stderr);
          if (err) {
            failed(err);
          } else {
            firstRun = false;
            pipeline.logger.log("sphinx-build done");
            done();
          }
        }
      );
    },
  };
}

function findRefWarnings(stderr: string): Error | null {
  const refWarnings = stderr
    .split("\n")
    .filter((line) => /WARNING: undefined label/.test(line));
  if (refWarnings.length) {
    return new Error(
      `Sphinx build failed with errors:\n${refWarnings.join("\n")}\n`
    );
  }
  return null;
}

export function createProcessSphinxXMLStep(
  processXml: (file: string, fileInfo: FileInfo) => Promise<void>,
  sortChanges: (changes: FileInfo[]) => FileInfo[][] = (changes) => [changes],
  preprocessChanges?: (
    changes: {file: string; fileInfo: FileInfo}[]
  ) => Promise<void>,
  xmlDir?: string
): PipelineStep {
  let runOnce = false;
  const pendingChanges: Map<string, FileInfo> = new Map();

  async function processPendingChanges(
    done: () => void,
    failed: (err: any) => void
  ) {
    const sortedChanges = sortChanges([...pendingChanges.values()]);

    for (const changes of sortedChanges) {
      try {
        const files = await Promise.all(
          changes.map(async (fileInfo) => ({
            file: await fs.readFile(fileInfo.path, "utf8"),
            fileInfo,
          }))
        );
        if (preprocessChanges) {
          await preprocessChanges(files);
        }
        await Promise.all(
          files.map(({file, fileInfo}) => processXml(file, fileInfo))
        );
      } catch (err) {
        failed(err);
        return;
      }
    }

    pendingChanges.clear();

    done();
  }

  return {
    onRun({pipeline, done, failed}) {
      if (!runOnce) {
        runOnce = true;
        xmlDir = xmlDir ?? pathJoin(getBuildDir(), "_xml", pipeline.name);

        const unwatch = watchFiles(
          pathJoin(xmlDir, "**/*.xml"),
          (type, path) => {
            if (type === "add" || type === "change") {
              pendingChanges.set(path, {
                path,
                relname: pathWithoutExt(relative(xmlDir!, path)),
              });
            }
          },
          () => {
            if (!pipeline.watchMode) {
              unwatch();
            }
            processPendingChanges(done, failed);
          }
        );
      } else {
        processPendingChanges(done, failed);
      }
    },
  };
}
