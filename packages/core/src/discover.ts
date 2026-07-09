import type { ExportedDeclarations, SourceFile } from "ts-morph";

export interface ComponentCandidate {
  name: string;
  declaration: ExportedDeclarations;
}

const PASCAL_CASE = /^[A-Z]/;

export function discoverComponentCandidates(
  sourceFile: SourceFile,
): ComponentCandidate[] {
  const candidates: ComponentCandidate[] = [];
  for (const [name, declarations] of sourceFile.getExportedDeclarations()) {
    if (!PASCAL_CASE.test(name)) continue;
    const declaration = declarations[0];
    if (!declaration) continue;
    if (declaration.getType().getCallSignatures().length === 0) continue;
    candidates.push({ name, declaration });
  }
  return candidates;
}
