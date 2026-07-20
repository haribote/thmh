import { readFile } from "node:fs/promises";
import type { Catalog } from "@thmh/core";

export interface CatalogSource {
  readonly name: string;
  load(): Promise<Catalog>;
}

export function analyzerSource(analyzer: {
  readonly promise: Promise<Catalog>;
}): CatalogSource {
  return {
    name: "the analyzer in this process",
    load: () => analyzer.promise,
  };
}

export function analysisSource(
  root: string,
  analyse: () => Promise<Catalog>,
): CatalogSource {
  let started: Promise<Catalog> | undefined;
  return {
    name: `analysis of ${root}`,
    load: () => {
      started ??= analyse();
      return started;
    },
  };
}

export const CATALOG_PATH = "/__thmh/api/catalog.json";
export const PROBE_TIMEOUT_MS = 2000;

export function httpSource(
  address: string,
  timeoutMs: number = PROBE_TIMEOUT_MS,
): CatalogSource {
  return {
    name: `the dev server at ${address}`,
    load: async () => {
      const response = await fetch(new URL(CATALOG_PATH, address), {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        throw new Error(`${address} answered ${response.status}`);
      }
      return (await response.json()) as Catalog;
    },
  };
}

export function fileSource(file: string): CatalogSource {
  return {
    name: `catalog.json at ${file}`,
    load: async () => JSON.parse(await readFile(file, "utf-8")) as Catalog,
  };
}
