import type { AnalyzeOptions, Catalog } from "./types";

export * from "./types";

export async function analyzeProject(
  _options: AnalyzeOptions,
): Promise<Catalog> {
  throw new Error("not implemented");
}
