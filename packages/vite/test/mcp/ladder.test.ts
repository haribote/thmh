import { mkdtemp, writeFile } from "node:fs/promises";
import { createServer, type RequestListener } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Catalog } from "@thmh/core";
import { describe, expect, it } from "vitest";
import { chooseSource, DEFAULT_ADDRESS } from "../../src/mcp/ladder";

function catalog(generator: string): Catalog {
  return {
    schemaVersion: 0,
    generator,
    generatedAt: "2026-07-20T00:00:00.000Z",
    components: [],
    warnings: [],
  };
}

async function serve(handler: RequestListener) {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  return {
    address: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

const analyse = async () => catalog("analysed");

describe("chooseSource", () => {
  it("takes the dev server when it answers 200 with a body that parses", async () => {
    const server = await serve((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(catalog("from-dev-server")));
    });

    try {
      const chosen = await chooseSource({
        root: await mkdtemp(path.join(tmpdir(), "thmh-")),
        address: server.address,
        analyse,
        report: () => {},
      });

      await expect(chosen.load()).resolves.toMatchObject({
        generator: "from-dev-server",
      });
    } finally {
      await server.close();
    }
  });

  it("falls through when the connection is refused", async () => {
    const chosen = await chooseSource({
      root: await mkdtemp(path.join(tmpdir(), "thmh-")),
      address: "http://127.0.0.1:1",
      analyse,
      report: () => {},
    });

    await expect(chosen.load()).resolves.toMatchObject({
      generator: "analysed",
    });
  });

  it("falls through when the status is not 200", async () => {
    const server = await serve((_req, res) => {
      res.writeHead(500).end();
    });

    try {
      const chosen = await chooseSource({
        root: await mkdtemp(path.join(tmpdir(), "thmh-")),
        address: server.address,
        analyse,
        report: () => {},
      });

      expect(chosen.name).toContain("analysis of");
    } finally {
      await server.close();
    }
  });

  it("falls through when the body does not parse", async () => {
    const server = await serve((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end("not json");
    });

    try {
      const chosen = await chooseSource({
        root: await mkdtemp(path.join(tmpdir(), "thmh-")),
        address: server.address,
        analyse,
        report: () => {},
      });

      expect(chosen.name).toContain("analysis of");
    } finally {
      await server.close();
    }
  });

  it("takes catalog.json at the root when no dev server answers", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "thmh-"));
    await writeFile(
      path.join(root, "catalog.json"),
      JSON.stringify(catalog("from-disk")),
      "utf-8",
    );

    const chosen = await chooseSource({
      root,
      address: "http://127.0.0.1:1",
      analyse,
      report: () => {},
    });

    await expect(chosen.load()).resolves.toMatchObject({
      generator: "from-disk",
    });
  });

  it("names the source it chose", async () => {
    const lines: string[] = [];
    await chooseSource({
      root: await mkdtemp(path.join(tmpdir(), "thmh-")),
      address: "http://127.0.0.1:1",
      analyse,
      report: (line) => lines.push(line),
    });

    expect(lines.at(-1)).toContain("analysis of");
  });

  it("says when a named address did not answer", async () => {
    const lines: string[] = [];
    await chooseSource({
      root: await mkdtemp(path.join(tmpdir(), "thmh-")),
      address: "http://127.0.0.1:1",
      analyse,
      report: (line) => lines.push(line),
    });

    expect(lines[0]).toContain("http://127.0.0.1:1 did not answer");
  });

  it("falls through when the address takes longer than the timeout", async () => {
    const server = await serve(() => {
      // never responds
    });

    try {
      const chosen = await chooseSource({
        root: await mkdtemp(path.join(tmpdir(), "thmh-")),
        address: server.address,
        timeoutMs: 20,
        analyse,
        report: () => {},
      });

      expect(chosen.name).toContain("analysis of");
    } finally {
      await server.close();
    }
  });

  it("looks at Vite's default port when no address is given", () => {
    expect(DEFAULT_ADDRESS).toBe("http://localhost:5173");
  });

  it("says nothing about an address the caller did not name", async () => {
    const lines: string[] = [];
    await chooseSource({
      root: await mkdtemp(path.join(tmpdir(), "thmh-")),
      analyse,
      report: (line) => lines.push(line),
    });

    expect(lines.some((line) => line.includes("did not answer"))).toBe(false);
  });
});
