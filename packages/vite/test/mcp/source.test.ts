import { mkdtemp, writeFile } from "node:fs/promises";
import { createServer, type RequestListener } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Catalog } from "@thmh/core";
import { describe, expect, it } from "vitest";
import {
  analysisSource,
  analyzerSource,
  fileSource,
  httpSource,
} from "../../src/mcp/source";

async function serve(handler: RequestListener) {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  return {
    address: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

function catalog(generator: string): Catalog {
  return {
    schemaVersion: 0,
    generator,
    generatedAt: "2026-07-20T00:00:00.000Z",
    components: [],
    warnings: [],
  };
}

describe("analyzerSource", () => {
  it("loads the analyzer's current catalog", async () => {
    const source = analyzerSource({ promise: Promise.resolve(catalog("a")) });

    await expect(source.load()).resolves.toMatchObject({ generator: "a" });
  });

  it("reads the analyzer again on a second load", async () => {
    let current = catalog("first");
    const source = analyzerSource({
      get promise() {
        return Promise.resolve(current);
      },
    });

    await source.load();
    current = catalog("second");

    await expect(source.load()).resolves.toMatchObject({
      generator: "second",
    });
  });
});

describe("fileSource", () => {
  it("loads the catalog at the given path", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "thmh-"));
    const file = path.join(dir, "catalog.json");
    await writeFile(file, JSON.stringify(catalog("from-disk")), "utf-8");

    await expect(fileSource(file).load()).resolves.toMatchObject({
      generator: "from-disk",
    });
  });

  it("rejects when the file cannot be read", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "thmh-"));

    await expect(
      fileSource(path.join(dir, "absent.json")).load(),
    ).rejects.toThrow();
  });

  it("names where it read", async () => {
    expect(fileSource("/tmp/c.json").name).toContain("/tmp/c.json");
  });
});

describe("httpSource", () => {
  it("loads the catalog the address serves", async () => {
    const server = await serve((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(catalog("from-dev-server")));
    });

    try {
      await expect(httpSource(server.address).load()).resolves.toMatchObject({
        generator: "from-dev-server",
      });
    } finally {
      await server.close();
    }
  });

  it("rejects when the address does not answer", async () => {
    await expect(httpSource("http://127.0.0.1:1").load()).rejects.toThrow();
  });
});

describe("analysisSource", () => {
  it("returns the catalog the analysis produced", async () => {
    const source = analysisSource("/root", async () => catalog("analysed"));

    await expect(source.load()).resolves.toMatchObject({
      generator: "analysed",
    });
  });

  it("runs the analysis once and answers later loads from it", async () => {
    let runs = 0;
    const source = analysisSource("/root", async () => {
      runs += 1;
      return catalog(`run-${runs}`);
    });

    await source.load();
    await expect(source.load()).resolves.toMatchObject({ generator: "run-1" });
    expect(runs).toBe(1);
  });

  it("does not run the analysis until the first load", () => {
    let runs = 0;
    analysisSource("/root", async () => {
      runs += 1;
      return catalog("x");
    });

    expect(runs).toBe(0);
  });
});
