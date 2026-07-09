import { assembleComponents } from "./assemble";
import { addSourceFiles, createTsProject } from "./project";
import type { AnalyzeOptions, Catalog, ComponentDoc } from "./types";

export { cartesianProduct, deriveAxes } from "./matrix";
export * from "./types";

const GENERATOR = "@thmh/core@0.0.0";
const DEFAULT_INCLUDE = ["src/**/*.tsx"];

export async function analyzeProject(
  options: AnalyzeOptions,
): Promise<Catalog> {
  const project = createTsProject(options.root, options.tsconfigPath);
  await addSourceFiles(
    project,
    options.root,
    options.include ?? DEFAULT_INCLUDE,
  );

  const components: ComponentDoc[] = [];
  const warnings: string[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    const result = assembleComponents(sourceFile, options.root);
    components.push(...result.components);
    warnings.push(...result.warnings);
  }

  return {
    schemaVersion: 0,
    generator: GENERATOR,
    generatedAt: new Date().toISOString(),
    components,
    warnings,
  };
}
