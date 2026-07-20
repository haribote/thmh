import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CatalogSource } from "./source";

export const MCP_PATH = "/__thmh/mcp";

export function createMcpServer(_source: CatalogSource): McpServer {
  return new McpServer({ name: "thmh", version: "0.1.0-next.0" });
}
