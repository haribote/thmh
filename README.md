# Tehon-Mihon (thmh)

Story-less UI component catalog for the AI era — auto-generated from your code, served by a Vite plugin, exposed to agents via MCP

## Overview

thmh reads your components directly: static analysis of their types and variant definitions generates every combination of their variants, so you never write a Story file.
It runs inside your app's own Vite dev server — one line in `vite.config.ts` — and inherits the aliases, Tailwind setup, and environment variables you already have, so there is no second build config to keep in sync.

Everything it knows is written to `catalog.json`, the single source of truth from which the human-facing UI, the agent-facing MCP server, and CI checks are all derived.

That MCP server exposes tools such as `search_components` and `get_component_detail`, letting coding agents find and reuse the components you already have instead of inventing near-duplicates.
The catalog UI is served at `/__thmh/`; repositories with no host app, such as standalone design systems, can use the `thmh` CLI instead.
