import { createServer } from "node:http";
import type { Catalog } from "@thmh/core";
import { describe, expect, it } from "vitest";
import { handleMcp } from "../../src/mcp/route";
import type { CatalogSource } from "../../src/mcp/source";

const source: CatalogSource = {
  name: "a test source",
  load: async (): Promise<Catalog> => ({
    schemaVersion: 0,
    generator: "test",
    generatedAt: "2026-07-20T00:00:00.000Z",
    components: [],
    warnings: [],
  }),
};

async function serve() {
  const server = createServer((req, res) => {
    void handleMcp(req, res, source);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  return {
    url: `http://127.0.0.1:${port}/__thmh/mcp`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

const INITIALIZE = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "test", version: "1" },
  },
};

describe("handleMcp", () => {
  it("refuses GET with 405 and a JSON-RPC error body", async () => {
    const server = await serve();
    try {
      const response = await fetch(server.url);

      expect(response.status).toBe(405);
      await expect(response.json()).resolves.toMatchObject({
        jsonrpc: "2.0",
        error: { message: expect.stringContaining("Method not allowed") },
      });
    } finally {
      await server.close();
    }
  });

  it("refuses DELETE with 405", async () => {
    const server = await serve();
    try {
      const response = await fetch(server.url, { method: "DELETE" });

      expect(response.status).toBe(405);
    } finally {
      await server.close();
    }
  });

  it("answers an initialize over POST", async () => {
    const server = await serve();
    try {
      const response = await fetch(server.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify(INITIALIZE),
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toContain("serverInfo");
    } finally {
      await server.close();
    }
  });

  it("does not answer with a session id", async () => {
    const server = await serve();
    try {
      const response = await fetch(server.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify(INITIALIZE),
      });

      expect(response.headers.get("mcp-session-id")).toBeNull();
    } finally {
      await server.close();
    }
  });

  it("serves two concurrent requests, so nothing is shared between them", async () => {
    const server = await serve();
    try {
      const post = () =>
        fetch(server.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
          },
          body: JSON.stringify(INITIALIZE),
        });

      const [a, b] = await Promise.all([post(), post()]);

      expect([a.status, b.status]).toEqual([200, 200]);
    } finally {
      await server.close();
    }
  });
});
