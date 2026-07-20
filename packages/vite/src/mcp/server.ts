import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
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

export async function runSearch(
  source: CatalogSource,
  args: { query: string; limit?: number },
): Promise<CallToolResult> {
  let catalog: Awaited<ReturnType<CatalogSource["load"]>>;
  try {
    catalog = await source.load();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Could not read ${source.name}: ${message}`,
        },
      ],
      isError: true,
    };
  }

  const answer = search(catalog, args.query, args.limit ?? DEFAULT_LIMIT);
  return {
    content: [{ type: "text", text: JSON.stringify(answer, null, 2) }],
  };
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

  return server;
}
