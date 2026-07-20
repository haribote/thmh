import { parseArgs } from "node:util";

export interface BuildArgs {
  root?: string;
  out?: string;
  include?: string;
  tsconfig?: string;
}

export function parseBuildArgs(args: string[]): BuildArgs {
  const { values } = parseArgs({
    args,
    options: {
      root: { type: "string" },
      out: { type: "string" },
      include: { type: "string" },
      tsconfig: { type: "string" },
    },
    strict: true,
    allowPositionals: false,
  });

  return values;
}
