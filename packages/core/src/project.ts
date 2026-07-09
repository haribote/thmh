import fs from "node:fs";
import path from "node:path";
import { glob } from "tinyglobby";
import { Project, ts } from "ts-morph";

export function createTsProject(root: string, tsconfigPath?: string): Project {
  const resolvedTsconfigPath = resolveTsconfigPath(root, tsconfigPath);
  if (resolvedTsconfigPath) {
    return new Project({
      tsConfigFilePath: resolvedTsconfigPath,
      skipAddingFilesFromTsConfig: true,
    });
  }

  return new Project({
    compilerOptions: {
      strict: true,
      jsx: ts.JsxEmit.ReactJSX,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
  });
}

function resolveTsconfigPath(
  root: string,
  tsconfigPath?: string,
): string | undefined {
  if (tsconfigPath) return tsconfigPath;

  const appTsconfigPath = path.join(root, "tsconfig.app.json");
  if (fs.existsSync(appTsconfigPath)) return appTsconfigPath;

  const baseTsconfigPath = path.join(root, "tsconfig.json");
  if (fs.existsSync(baseTsconfigPath)) return baseTsconfigPath;

  return undefined;
}

export async function addSourceFiles(
  project: Project,
  root: string,
  include: string[],
): Promise<void> {
  const filePaths = await glob(include, { cwd: root, absolute: true });
  project.addSourceFilesAtPaths(filePaths);
}
