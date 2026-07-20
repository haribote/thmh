import type { Catalog } from "@thmh/core";
import { describe, expect, it } from "vitest";
import { createMcpServer } from "../../src/mcp/server";
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

describe("createMcpServer", () => {
  it("builds a server that can be connected to a transport", async () => {
    const server = createMcpServer(source);

    expect(server).toHaveProperty("connect");
    expect(server).toHaveProperty("close");
  });
});
