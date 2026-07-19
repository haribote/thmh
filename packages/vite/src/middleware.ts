import { readFile } from "node:fs/promises";
import type { ServerResponse } from "node:http";
import type { Connect, ViteDevServer } from "vite";
import type { AnalyzerState } from "./analyzer";
import { PREVIEW_ENTRY_ID } from "./preview";

const SHELL_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>thmh catalog</title>
  </head>
  <body>
    <main id="app"></main>
    <script type="module" src="/__thmh/ui.js"></script>
  </body>
</html>
`;

const PREVIEW_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>thmh preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/@id/__x00__${PREVIEW_ENTRY_ID}"></script>
  </body>
</html>
`;

export interface MiddlewareContext {
  analyzer: AnalyzerState;
  server: ViteDevServer;
}

export function createThmhMiddleware(
  context: MiddlewareContext,
): Connect.NextHandleFunction {
  return (req, res, next) => {
    const pathname = (req.url ?? "").split("?")[0];
    switch (pathname) {
      case "/__thmh/":
      case "/__thmh/index.html":
        sendHtml(res, SHELL_HTML);
        return;
      case "/__thmh/ui.js":
        void sendUiScript(res, next);
        return;
      case "/__thmh/api/catalog.json":
        void sendCatalog(res, context.analyzer, next);
        return;
      case "/__thmh/api/events":
        handleEvents(req, res, context.analyzer);
        return;
      case "/__thmh/preview":
        void sendPreview(req, res, context.server, next);
        return;
      default:
        next();
    }
  };
}

function sendHtml(res: ServerResponse, html: string): void {
  res.setHeader("Content-Type", "text/html");
  res.end(html);
}

async function sendUiScript(
  res: ServerResponse,
  next: Connect.NextFunction,
): Promise<void> {
  try {
    const filePath = new URL("./client/ui.js", import.meta.url);
    const code = await readFile(filePath, "utf-8");
    res.setHeader("Content-Type", "text/javascript");
    res.end(code);
  } catch (error) {
    next(error);
  }
}

async function sendCatalog(
  res: ServerResponse,
  analyzer: AnalyzerState,
  next: Connect.NextFunction,
): Promise<void> {
  try {
    const catalog = await analyzer.promise;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache");
    res.end(JSON.stringify(catalog));
  } catch (error) {
    next(error);
  }
}

function handleEvents(
  req: Connect.IncomingMessage,
  res: ServerResponse,
  analyzer: AnalyzerState,
): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write(":thmh\n\n");
  const unsubscribe = analyzer.onUpdate(() => {
    res.write("event: catalog-updated\ndata: {}\n\n");
  });
  req.on("close", () => {
    unsubscribe();
  });
}

async function sendPreview(
  req: Connect.IncomingMessage,
  res: ServerResponse,
  server: ViteDevServer,
  next: Connect.NextFunction,
): Promise<void> {
  try {
    // @vitejs/plugin-react needs its preamble injected via transformIndexHtml,
    // otherwise the preview module throws "can't detect preamble" on load.
    const html = await server.transformIndexHtml(
      req.url ?? "/__thmh/preview",
      PREVIEW_HTML,
    );
    res.setHeader("Content-Type", "text/html");
    res.end(html);
  } catch (error) {
    next(error);
  }
}
