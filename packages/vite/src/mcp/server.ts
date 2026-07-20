import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Catalog } from "@thmh/core";
import { z } from "zod";
import { detail } from "./detail";
import { DEFAULT_LIMIT, search } from "./search";
import type { CatalogSource } from "./source";

export const MCP_PATH = "/__thmh/mcp";

const SEARCH_INPUT = {
  query: z
    .string()
    .describe("Words to look for. Empty returns every component."),
  limit: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe(`How many results to return. Defaults to ${DEFAULT_LIMIT}.`),
};

function errorAnswer(text: string): CallToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

function jsonAnswer(value: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  };
}

async function withCatalog(
  source: CatalogSource,
  use: (catalog: Catalog) => CallToolResult,
): Promise<CallToolResult> {
  try {
    return use(await source.load());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorAnswer(`Could not read ${source.name}: ${message}`);
  }
}

export function runSearch(
  source: CatalogSource,
  args: { query: string; limit?: number },
): Promise<CallToolResult> {
  return withCatalog(source, (catalog) =>
    jsonAnswer(search(catalog, args.query, args.limit ?? DEFAULT_LIMIT)),
  );
}

export function runDetail(
  source: CatalogSource,
  args: { id: string },
): Promise<CallToolResult> {
  return withCatalog(source, (catalog) => {
    const found = detail(catalog, args.id);
    if (found) return jsonAnswer(found);

    return errorAnswer(
      [
        `No component has the id ${args.id}. Use search_components to find one that is in the catalog.`,
        ...catalog.warnings.map((warning) => `warning: ${warning}`),
      ].join("\n"),
    );
  });
}

export function createMcpServer(source: CatalogSource): McpServer {
  const server = new McpServer({ name: "thmh", version: "0.1.0-next.0" });

  server.registerTool(
    "search_components",
    {
      description:
        "Find components in this project's catalog. Matches each word against a component's name, description, prop names, and variant option names.",
      inputSchema: SEARCH_INPUT,
    },
    (args) => runSearch(source, args),
  );

  server.registerTool(
    "get_component_detail",
    {
      description:
        "Return one component's full record from this project's catalog, as the manifest holds it. Takes the id search_components returns.",
      inputSchema: { id: z.string().min(1).describe("The component's id.") },
    },
    (args) => runDetail(source, args),
  );

  return server;
}
