#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { analyzeProject } from "@thmh/core";

const USAGE = `Usage: thmh <command> [options]

Commands:
  build [--root <dir>] [--out <file>]   Analyze the project and write catalog.json
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

  const catalog = await analyzeProject({ root });
  await fs.writeFile(out, `${JSON.stringify(catalog, null, 2)}\n`, "utf-8");

  process.stdout.write(`${catalog.components.length} component(s) analyzed\n`);
  process.stdout.write(`catalog written to ${out}\n`);
}

function parseBuildArgs(args: string[]): { root?: string; out?: string } {
  const options: { root?: string; out?: string } = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--root") {
      options.root = args[i + 1];
      i += 1;
    } else if (arg === "--out") {
      options.out = args[i + 1];
      i += 1;
    }
  }
  return options;
}

main(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`thmh: ${message}\n`);
  process.exitCode = 1;
});
