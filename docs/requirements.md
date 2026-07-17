# Requirements

What thmh builds, and why. This document captures **What** (the capabilities to build) and, as supporting context, **Why** (the rationale). It deliberately omits **How** — design and implementation live in each feature document under the domain directories.

Each requirement should be traceable to one or more feature documents (`docs/<domain>/{ID}_slug.md`). See [CONTRIBUTING.md](../CONTRIBUTING.md) for conventions.

## Product

thmh is a story-less UI component catalog generator. It statically analyzes components to enumerate every variant, serves the result to humans via a Vite plugin, and exposes it to agents via an MCP server — so that neither humans nor agents maintain a hand-written duplicate of a component's truth.

<!-- Fill in the product-level What/Why. Keep How out. -->

## analysis

<!-- What the analysis domain must produce: discovered components, extracted props, variants, tokens. Why. -->

## manifest

<!-- What the manifest (catalog.json) must contain and guarantee. Why a single source of truth. -->

## mcp

<!-- What tools the MCP server must expose and what they must return. Why agents need them. -->

## cli

<!-- What commands the CLI must provide. Why (repos without a host app, CI). -->

## integration

<!-- What external ecosystems thmh must interoperate with. Why. -->

## ui

<!-- What the human-facing catalog must show. Why (the "sample to look at" audience). -->
