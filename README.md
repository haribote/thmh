# Tehon-Mihon (thmh)

[English](README.md) | [日本語](README.ja.md)

Story-less UI component catalog for the AI era — auto-generated from your code, served by a Vite plugin, exposed to agents via MCP

## Overview

thmh reads your components directly: static analysis of their types and variant definitions generates every combination of their variants, so you never write a Story file.
It runs inside your app's own Vite dev server — one line in `vite.config.ts` — and inherits the aliases, Tailwind setup, and environment variables you already have, so there is no second build config to keep in sync.

Everything it knows is written to `catalog.json`, the single source of truth from which the human-facing UI, the agent-facing MCP server, and CI checks are all derived.

That MCP server exposes tools such as `search_components` and `get_component_detail`, letting coding agents find and reuse the components you already have instead of inventing near-duplicates.
The catalog UI is served at `/__thmh/`; repositories with no host app, such as standalone design systems, can use the `thmh` CLI instead.

## The name

*Tehon-Mihon* is two Japanese words that both end in 本 (*hon*) — a book, and the original a thing is copied from.

**手本** (てほん, [tehoɴ]) is a model to copy: the sheet of calligraphy a student sets beside their own paper and reproduces stroke for stroke.
This is what an agent needs — the exact shape of a component, its props and its variants, ready to be followed.

**見本** (みほん, [mihoɴ]) is a sample to look at: the swatch, the specimen, the one you examine before you choose.
This is what a person needs — the component rendered, every variant on screen.

From one manifest, two books are born at once.

## Getting Started (Prototype)

This section walks through the current prototype. The `thmh` CLI only implements `build`; `dev`, `init`, and `mcp` print a "not implemented" message for now.

**Prerequisites:** Node.js 24+ and pnpm 11 (see `packageManager` in `package.json`).

```bash
git clone <this repo> && cd thmh
pnpm install
pnpm build
pnpm dev:example
```

`dev:example` builds every package, then starts the Vite dev server for `examples/react-app`. Open:

- `http://localhost:5173/` — the example app itself
- `http://localhost:5173/__thmh/` — the catalog, with every variant of the example `Button` rendered
- `http://localhost:5173/__thmh/api/catalog.json` — the same data as a manifest

Edit `examples/react-app/src/components/ui/button.tsx` and save — the catalog re-analyzes and refreshes within a couple of seconds, no restart needed.

To generate a manifest without a dev server, run the CLI against a built app:

```bash
node packages/thmh/dist/cli.js build --root examples/react-app --out catalog.json
```

To run the test suite:

```bash
pnpm test
```
