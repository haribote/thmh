import type { Catalog } from "@thmh/core";
import { analyzeProject } from "@thmh/core";
import type { Logger } from "vite";

const INVALIDATE_DEBOUNCE_MS = 300;

export interface AnalyzerState {
  readonly promise: Promise<Catalog>;
  start(root: string, include: string[] | undefined): void;
  invalidate(): void;
  onUpdate(callback: () => void): () => void;
}

function createEmptyCatalog(warning: string): Catalog {
  return {
    schemaVersion: 0,
    generator: "@thmh/vite",
    generatedAt: new Date().toISOString(),
    components: [],
    warnings: [warning],
  };
}

export function createAnalyzer(logger: Logger): AnalyzerState {
  let root = "";
  let include: string[] | undefined;
  let promise: Promise<Catalog> = Promise.resolve(
    createEmptyCatalog("thmh: analysis not started yet"),
  );
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  const subscribers = new Set<() => void>();

  async function runAnalysis(): Promise<Catalog> {
    try {
      return await analyzeProject({ root, include });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`[thmh] analysis failed: ${message}`);
      return createEmptyCatalog(message);
    }
  }

  return {
    get promise() {
      return promise;
    },
    start(nextRoot, nextInclude) {
      root = nextRoot;
      include = nextInclude;
      promise = runAnalysis();
    },
    invalidate() {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debounceTimer = undefined;
        promise = runAnalysis().then((catalog) => {
          for (const callback of subscribers) {
            callback();
          }
          return catalog;
        });
      }, INVALIDATE_DEBOUNCE_MS);
    },
    onUpdate(callback) {
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    },
  };
}
