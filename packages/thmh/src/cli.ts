#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { analyzeProject } from "@thmh/core";
import { parseBuildArgs } from "./args";
import { reportWarnings } from "./report";

const USAGE = `Usage: thmh <command> [options]

Commands:
  build [options]                       Analyze the project and write catalog.json
    --root <dir>                        Directory to analyze (default: cwd)
    --out <file>                        File to write (default: <root>/catalog.json)
    --include <glob>                    Narrow the analyzed set
    --tsconfig <file>                   TypeScript configuration to analyze under
  dev                                   Not implemented in prototype
  init                                  Not implemented in prototype
  mcp                                   Not implemented in prototype
`;

async function main(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;

  switch (command) {
    case "build":
      await runBuild(rest);
      return;
    case "dev":
    case "init":
    case "mcp":
      process.stderr.write(`${command}: not implemented in prototype\n`);
      process.exitCode = 1;
      return;
    default:
      process.stdout.write(USAGE);
      process.exitCode = command === undefined ? 0 : 1;
  }
}

async function runBuild(args: string[]): Promise<void> {
  const options = parseBuildArgs(args);
  const root = options.root ? path.resolve(options.root) : process.cwd();
  const out = options.out
    ? path.resolve(options.out)
    : path.join(root, "catalog.json");

  const catalog = await analyzeProject({
    root,
    ...(options.include ? { include: [options.include] } : {}),
    ...(options.tsconfig
      ? { tsconfigPath: path.resolve(options.tsconfig) }
      : {}),
  });
  await fs.writeFile(out, `${JSON.stringify(catalog, null, 2)}\n`, "utf-8");

  reportWarnings(catalog.warnings, (chunk) => process.stderr.write(chunk));

  process.stdout.write(`${catalog.components.length} component(s) analyzed\n`);
  process.stdout.write(`catalog written to ${out}\n`);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`thmh: ${message}\n`);
  process.exitCode = 1;
});
