import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { createAnalyzer } from "./analyzer";
import { createThmhMiddleware } from "./middleware";
import {
  generatePreviewEntryCode,
  PREVIEW_ENTRY_ID,
  RESOLVED_PREVIEW_ENTRY_ID,
} from "./preview";

export interface ThmhOptions {
  include?: string[];
  css?: string;
}

const DEFAULT_CSS = "/src/index.css";
const WATCHED_EXTENSIONS = [".ts", ".tsx"];
const EXCLUDED_SEGMENTS = new Set(["node_modules", "dist", ".git"]);

function isWatchedFile(file: string): boolean {
  if (!WATCHED_EXTENSIONS.some((extension) => file.endsWith(extension))) {
    return false;
  }
  return !file.split(/[\\/]/).some((segment) => EXCLUDED_SEGMENTS.has(segment));
}

export default function thmh(options: ThmhOptions = {}): Plugin {
  const css = options.css ?? DEFAULT_CSS;
  const include = options.include;
  let root = process.cwd();

  return {
    name: "thmh",
    apply: "serve",
    configResolved(config: ResolvedConfig) {
      root = config.root;
    },
    configureServer(server: ViteDevServer) {
      const analyzer = createAnalyzer(server.config.logger);
      analyzer.start(root, include);

      server.watcher.on("all", (event, file) => {
        if (event !== "add" && event !== "change" && event !== "unlink") {
          return;
        }
        if (!isWatchedFile(file)) {
          return;
        }
        analyzer.invalidate();
      });

      server.middlewares.use(createThmhMiddleware({ analyzer, server }));
    },
    resolveId(id: string) {
      if (id === PREVIEW_ENTRY_ID) {
        return RESOLVED_PREVIEW_ENTRY_ID;
      }
      return undefined;
    },
    load(id: string) {
      if (id === RESOLVED_PREVIEW_ENTRY_ID) {
        return generatePreviewEntryCode(css);
      }
      return undefined;
    },
  };
}
