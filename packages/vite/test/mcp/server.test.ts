import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { Catalog } from "@thmh/core";
import { describe, expect, it } from "vitest";
import { createMcpServer, runDetail, runSearch } from "../../src/mcp/server";
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

function textOf(answer: { content: unknown[] }): string {
  const block = answer.content[0];
  if (
    typeof block === "object" &&
    block !== null &&
    "text" in block &&
    typeof block.text === "string"
  ) {
    return block.text;
  }
  throw new Error("the answer carried no text block");
}

describe("createMcpServer", () => {
  it("builds a server that can be connected to a transport", async () => {
    const server = createMcpServer(source);

    expect(server).toHaveProperty("connect");
    expect(server).toHaveProperty("close");
  });

  it("offers both tools to a client", async () => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test", version: "1" });
    await Promise.all([
      createMcpServer(source).connect(serverSide),
      client.connect(clientSide),
    ]);

    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "get_component_detail",
      "search_components",
    ]);
  });
});

describe("detailTool", () => {
  it("answers an unknown id with an error", async () => {
    const answer = await runDetail(source, { id: "src/Nope.tsx#Nope" });

    expect(answer.isError).toBe(true);
  });

  it("quotes the id and names search_components in that error", async () => {
    const answer = await runDetail(source, { id: "src/Nope.tsx#Nope" });

    expect(textOf(answer)).toContain("src/Nope.tsx#Nope");
    expect(textOf(answer)).toContain("search_components");
  });

  it("includes the catalog's warnings in that error", async () => {
    const damaged: CatalogSource = {
      name: "the analyzer in this process",
      load: async () => ({
        schemaVersion: 0,
        generator: "test",
        generatedAt: "2026-07-20T00:00:00.000Z",
        components: [],
        warnings: ["analysis failed: tsconfig is malformed"],
      }),
    };

    const answer = await runDetail(damaged, { id: "src/Button.tsx#Button" });

    expect(textOf(answer)).toContain("tsconfig is malformed");
  });

  it("answers with an error naming the source when it rejects", async () => {
    const broken: CatalogSource = {
      name: "analysis of /root",
      load: async () => {
        throw new Error("boom");
      },
    };

    const answer = await runDetail(broken, { id: "any" });

    expect(answer.isError).toBe(true);
    expect(textOf(answer)).toContain("analysis of /root");
    expect(textOf(answer)).toContain("boom");
  });
});

describe("searchTool", () => {
  it("answers with the search result as JSON", async () => {
    const answer = await runSearch(source, { query: "" });

    expect(answer.isError).toBeUndefined();
    expect(JSON.parse(textOf(answer))).toMatchObject({
      matched: 0,
      total: 0,
    });
  });

  it("answers with an error when the source rejects", async () => {
    const broken: CatalogSource = {
      name: "analysis of /root",
      load: async () => {
        throw new Error("tsconfig is malformed");
      },
    };

    const answer = await runSearch(broken, { query: "" });

    expect(answer.isError).toBe(true);
  });

  it("names the source and the failure in that error", async () => {
    const broken: CatalogSource = {
      name: "analysis of /root",
      load: async () => {
        throw new Error("tsconfig is malformed");
      },
    };

    const answer = await runSearch(broken, { query: "" });

    expect(textOf(answer)).toContain("analysis of /root");
    expect(textOf(answer)).toContain("tsconfig is malformed");
  });

  it("carries no JSON body in that error", async () => {
    const broken: CatalogSource = {
      name: "analysis of /root",
      load: async () => {
        throw new Error("boom");
      },
    };

    const answer = await runSearch(broken, { query: "" });

    expect(() => JSON.parse(textOf(answer))).toThrow();
  });
});
