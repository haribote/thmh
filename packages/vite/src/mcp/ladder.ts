import { access } from "node:fs/promises";
import path from "node:path";
import type { Catalog } from "@thmh/core";
import {
  analysisSource,
  type CatalogSource,
  fileSource,
  httpSource,
} from "./source";

export const DEFAULT_ADDRESS = "http://localhost:5173";

export interface LadderOptions {
  root: string;
  address?: string;
  timeoutMs?: number;
  analyse: () => Promise<Catalog>;
  report: (line: string) => void;
}

export async function chooseSource(
  options: LadderOptions,
): Promise<CatalogSource> {
  const address = options.address ?? DEFAULT_ADDRESS;
  const overDevServer = httpSource(address, options.timeoutMs);

  try {
    await overDevServer.load();
    options.report(`reading ${overDevServer.name}`);
    return overDevServer;
  } catch {
    if (options.address) {
      options.report(`${address} did not answer`);
    }
  }

  const file = path.join(options.root, "catalog.json");
  try {
    await access(file);
    const overFile = fileSource(file);
    options.report(`reading ${overFile.name}`);
    return overFile;
  } catch {
    const overAnalysis = analysisSource(options.root, options.analyse);
    options.report(`reading ${overAnalysis.name}`);
    return overAnalysis;
  }
}
