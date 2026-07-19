import type { ServerResponse } from "node:http";
import type { Connect, ViteDevServer } from "vite";
import { describe, expect, it } from "vitest";
import type { AnalyzerState } from "../src/analyzer";
import { createThmhMiddleware } from "../src/middleware";

function serve(pathname: string): Promise<string> {
  const server = {
    transformIndexHtml: (_url: string, html: string) => Promise.resolve(html),
  } as unknown as ViteDevServer;
  const middleware = createThmhMiddleware({
    analyzer: {} as AnalyzerState,
    server,
  });

  return new Promise((resolve, reject) => {
    const res = {
      setHeader() {},
      end: resolve,
    } as unknown as ServerResponse;

    middleware(
      { url: pathname } as Connect.IncomingMessage,
      res,
      (error?: unknown) => reject(error ?? new Error(`unhandled: ${pathname}`)),
    );
  });
}

describe("the catalog shell", () => {
  it("declares the language of its own text", async () => {
    expect(await serve("/__thmh/")).toContain('<html lang="en">');
  });

  it("lets a small screen reflow instead of rendering at desktop width", async () => {
    expect(await serve("/__thmh/")).toContain(
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    );
  });

  it("makes the mount point a main landmark", async () => {
    expect(await serve("/__thmh/")).toContain('<main id="app"></main>');
  });
});

describe("the preview shell", () => {
  it("declares the language of its own text", async () => {
    expect(await serve("/__thmh/preview")).toContain('<html lang="en">');
  });

  it("lets a small screen reflow instead of rendering at desktop width", async () => {
    expect(await serve("/__thmh/preview")).toContain(
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    );
  });

  it("follows the same colour scheme as the catalog around it", async () => {
    expect(await serve("/__thmh/preview")).toContain(
      "color-scheme: light dark",
    );
  });
});
