# Requirements

What thmh builds, and why. This document captures **What** (the capabilities to build) and, as supporting context, **Why** (the rationale). It deliberately omits **How** — design and implementation live in each feature document under the domain directories.

Each requirement should be traceable to one or more feature documents (`docs/<domain>/{ID}_slug.md`). See [CONTRIBUTING.md](../CONTRIBUTING.md) for conventions.

## Overview

thmh is a story-less UI component catalog generator. It statically analyzes components to enumerate every variant, serves the result to humans via a Vite plugin, and exposes it to agents via an MCP server — so that neither humans nor agents maintain a hand-written duplicate of a component's truth.

## Background and goals

Storybook has defined component cataloging for a decade, but its model carries structural costs: Story files must be hand-written and kept in sync with the implementation, configuration is duplicated between the app and its Storybook instance, and the catalog is a human-facing UI with little machine readability.

That last cost matters more as coding agents help build UI. An agent cannot reliably ask "what components exist, what are their props, what variants are defined?" without a human intermediary, and it cannot tell a real component from a hallucinated one.

The "two books" concept answers this by deriving both audiences' views from one manifest. 手本 (a model to follow) is what an agent needs: the exact shape of a component, its props and variants, ready to be reproduced. 見本 (a sample to look at) is what a person needs: the component rendered, every variant on screen. Both are generated from `catalog.json`, a machine-readable manifest built by static analysis of component definitions and variant rules.

Two differences set thmh apart from existing tools:

1. **Story-less auto-generation.** thmh reads a component's type signature and variant definition (via class-variance-authority or similar) and enumerates every combination, instead of asking authors to hand-write Stories.
2. **Co-located with the app's dev server.** thmh runs as a Vite plugin inside the app's own dev server, inheriting its aliases, Tailwind setup, and environment, so there is no second build config to keep in sync.

The goal is a single source of truth — `catalog.json` — from which the human-facing catalog UI, the agent-facing MCP server, and CI checks are all derived.

## Target users

- **Primary — teams that never adopted Storybook, and agent-heavy developers.** Projects for which a full Storybook setup was too heavy, and developers who work day to day with AI coding agents and want those agents to reuse existing components instead of inventing near-duplicates.
- **Secondary — UI library and design-system authors.** Authors who want to ship a machine-readable manifest and an MCP endpoint alongside their library, so consumers' agents can use it correctly without the author maintaining a separate documentation site.

## Scope

### In scope

The full long-term vision is in scope. Each capability is tagged with the release phase in which it first lands (see Roadmap for phase definitions).

- Story-less catalog generation from static analysis of components and variant rules. _(Prototype)_
- A single machine-readable manifest, `catalog.json`, as the source of truth shared by every downstream consumer. _(Prototype)_
- Three interfaces derived from the manifest: a human catalog UI _(Prototype)_, an agent-facing MCP server _(Beta onward)_, and CI checks _(GA)_.
- A pluggable adapter architecture — Framework, Variant (style), and Token adapters — so support extends beyond React and cva over time. _(Beta onward)_
- Story-less override definitions (`defineCatalog`) for context, decorators, mock props, and interactions that static analysis cannot infer. _(GA)_
- Support for React meta-frameworks without a Vite host, starting with Next.js: analysis and client-component preview via the standalone path. _(GA; React Server Components preview is Future)_
- A publishing ecosystem for library authors: bundling `catalog.json` in npm packages, a lightweight remote read-only MCP, and prebuilt manifests for external libraries. _(Future)_
- Rendering and verification: screenshots, visual regression, and interaction tests. _(Future)_

### Out of scope

These are non-goals, not merely deferred work.

- **Generating new components.** thmh documents and catalogs existing components. `add_variant` appends override metadata only; it never scaffolds component implementation.
- **A general-purpose test runner.** Interaction tests exist to verify the catalog. thmh does not replace an application's unit or end-to-end test suite.
- **Hosting and deployment.** thmh produces static build artifacts; deploying and serving them is the user's responsibility.
- **Offering thmh as a SaaS/PaaS or paid support.** thmh stays an open-source tool and library. Managed hosting, a hosted service, and commercial enterprise support are not goals.

Design-tool integration (Figma and the like) is deliberately **not** excluded. It is left open for the future as design-token analysis matures, but it is not committed on this roadmap.

## Roadmap

Phases are cumulative. Exit criteria state what must hold for a phase to be considered done; acceptance criteria live here rather than in a separate section.

### Prototype (delivered)

Capabilities: static analysis of cva components and automatic variant-matrix enumeration; a Vite plugin serving a live catalog at `/__thmh/` with variant matrix and iframe previews; a machine-readable `catalog.json` (schemaVersion 0); live reload over Server-Sent Events.

Exit criteria: adding the plugin to an existing Vite app in one line renders every variant of a cva component without a Story file, and the same information is available as machine-readable `catalog.json`.

### Beta (Vite + React + Tailwind, adapter foundation, agent MCP)

Capabilities: a Framework / Variant / Token adapter interface with a registry, replacing today's hardcoded wiring; a Tailwind adapter that extracts design tokens (v3 config and v4 `@theme`) and builds a component-to-token dependency graph; an MCP server exposing `search_components` and `get_component_detail`; schema stabilization (a versioned `catalog.json` and a published JSON Schema); `thmh init` for setup and adapter detection; and an official project website — a landing page and published documentation (a live catalog demo may be published separately).

Exit criteria: React + cva analysis runs on top of the adapter interface, and the Tailwind adapter is added without breaking the manifest contract; agents can query the MCP server and receive valid component metadata; `catalog.json` is versioned so consumers can detect incompatibility; configuration is expressible through `thmh()` options without a second config file; and the official website (landing and documentation) is published.

### General availability (shadcn/ui, override definitions, breaking-change detection)

Capabilities: `defineCatalog` override definitions (decorators, mock props, variant overrides) that let context-dependent and Radix-composed components render; a hardened React adapter (`forwardRef`, `Slot`/`asChild`, non-cva styled components); optional shadcn `registry.json` interop; CI structural diff and breaking-change detection; the `add_variant` MCP tool; and Next.js support — cataloging Next.js projects through the standalone path with client-component and `next/*` primitive preview (RSC preview deferred to Future).

Exit criteria: shadcn/ui components, including Radix-composed ones, render in the catalog without hand-written Stories; a Next.js project's client components render in the catalog without a Vite host; breaking changes to props are caught in CI before merge; agents can add and verify variant overrides through MCP without direct file access.

### Future (framework/style pluggability, rendering verification, public ecosystem)

Capabilities: external-library support via prebuilt manifests and `.d.ts` analysis; rendering and verification via Playwright (screenshots, visual regression, `run_interaction_test`); a public ecosystem (a lightweight remote MCP, an npm manifest convention, third-party adapters); and a v2.0 refactor that decouples React and cva from the core to add Vue/Svelte and tailwind-variants/panda adapters.

Exit criteria: adapters for a second framework and a second variant system are contributed and reviewed through the public repository without core changes on every addition; agents can screenshot components and run basic interactions; multiple libraries publish `catalog.json` in their packages and agents can query them.

## Glossary

- **story-less** — The defining principle: variant combinations and component documentation are derived from code (cva, prop types) rather than hand-written Story files.
- **catalog.json / manifest** — The machine-readable JSON that is the single source of truth for component information (names, props, variants, defaults, token dependencies, decorators). Read by the UI, the MCP server, and CI. Versioned via `schemaVersion`.
- **variant** — One configuration of a component, defined by a set of prop values.
- **variant matrix** — The Cartesian product of a component's variant axes (e.g. `size` × `variant`).
- **adapter** — A pluggable analysis module. **Framework** adapters (e.g. React) extract props; **Variant** adapters (e.g. cva) extract style-variant definitions; **Token** adapters (e.g. Tailwind) extract design tokens and component-to-token dependencies.
- **cva (class-variance-authority)** — A library for declaring variant matrices in TypeScript; thmh's Variant adapter analyzes `cva()` calls to enumerate combinations.
- **design token** — A named, reusable style value (color, spacing, etc.), typically from Tailwind config or CSS custom properties.
- **decorator / `defineCatalog`** — An optional override file supplying what static analysis cannot infer: decorators (context providers), mock props, custom variants, and interactions.
- **MCP server** — A Model Context Protocol server exposing the catalog to agents, over Streamable HTTP when co-located with the dev server, or stdio when standalone.
- **MCP tools** — `search_components` (find components), `get_component_detail` (full metadata), and later `render_preview`, `run_interaction_test`, and `add_variant`.
- **feature document** — A per-feature spec/design at `docs/<domain>/{ID}_slug.md`.
- **capability domain** — One of `analysis`, `manifest`, `mcp`, `cli`, `integration`, `ui`.

## Functional requirements

Requirements are grouped by capability domain and tagged with the phase in which they first land. Detailed design belongs in the corresponding feature documents.

A requirement that has been designed carries the feature ID of its design document at the end of the bullet. A bullet with no ID is a requirement nobody has designed yet. See [design.md](design.md) for the procedure.

### analysis

- Extract component props, types, and JSDoc from TypeScript sources via the type checker. _(Prototype)_ — ANA002
- Discover exported PascalCase components with call signatures. _(Prototype)_ — ANA001
- Analyze cva variant definitions and extract axes, options, defaults, and compound variants. _(Prototype)_ — ANA003
- Generate the full variant matrix for each component. _(Prototype)_ — ANA004
- Combine discovery and the adapters' output into one record per component, isolating a failure to the component that caused it. _(Prototype)_ — ANA005
- Extract Tailwind design tokens (v3 config, v4 `@theme`) and build a component-to-token dependency graph. _(Beta)_
- Provide a pluggable adapter registry for additional frameworks and style systems. _(Beta; extended in Future)_
- Collect real usage examples from the host app's Vite module graph. _(Future)_

### manifest

- Produce a `catalog.json` capturing components, props, variants, defaults, and dependencies. _(Prototype)_ — MAN001, MAN003
- Version the manifest via `schemaVersion` and publish a JSON Schema for external validation. _(Beta)_
- Re-derive the manifest on file change during development. _(Prototype; incremental, file-level analysis targeted for Beta)_ — MAN002
- Produce a static `catalog.json` via `thmh build` for CI and hosted catalogs. _(Prototype)_
- Merge `defineCatalog` overrides into the generated manifest without duplication. _(GA)_
- Detect breaking changes between manifest versions (prop or variant removal, signature changes). _(GA)_

### mcp

- Expose an MCP server co-located with the dev server. _(Beta)_
- `search_components`: return components matching a query. _(Beta)_
- `get_component_detail`: return full metadata for one component. _(Beta)_
- Support both Streamable HTTP and stdio transports. _(Beta)_
- `add_variant`: append a variant override to a `defineCatalog` file. _(GA)_
- `render_preview` and `run_interaction_test`: render and verify variants. _(Future)_

### cli

- `thmh build`: generate a static `catalog.json`. _(Prototype)_
- `thmh init`: wire the plugin and register the MCP endpoint. _(Beta)_
- `thmh dev`: run a standalone catalog server for repositories with no host app. _(Beta)_
- `thmh mcp`: run the MCP server in stdio mode. _(Beta)_

### integration

- Run as a Vite plugin inheriting the host app's config (aliases, CSS, environment). _(Prototype)_ — INT001
- Analyze through the stable ts-morph (TS 6.0) API, compatible with consumer projects on TypeScript 7. _(Prototype)_ — INT002
- Detect cva and Tailwind automatically for common setups, with explicit registration available. _(Beta)_
- Interoperate with shadcn `registry.json`. _(GA, optional)_
- Catalog Next.js projects without a Vite host (via the standalone path), previewing client components (`'use client'`) and common `next/*` primitives. _(GA; RSC preview deferred)_
- Discover bundled `catalog.json` from installed npm packages and merge them. _(Future)_

### ui

- Serve a browsable catalog at `/__thmh/`. _(Prototype)_
- Render each variant in a sandboxed iframe. _(Prototype)_
- Show the variant matrix and a props table (name, type, required, default, description). _(Prototype)_
- Live-reload the catalog when the manifest changes. _(Prototype)_
- Provide search and filtering across components. _(Beta)_
- Link catalog entries to their feature documents. _(Future)_

## Non-functional requirements

- **Manifest stability and versioning.** `catalog.json` is a contract. Its schema is versioned so it can evolve while consumers (CI, agents) detect incompatibility, and breaking changes are surfaced rather than silent.
- **Performance through incremental analysis.** Saving a file and seeing the change reflected in the catalog stays within a few seconds, and analysis remains practical on large component sets by re-analyzing only what changed.
- **Accessibility of the catalog UI.** The human-facing catalog is keyboard navigable, uses semantic HTML, and meets sufficient color contrast — accessibility is a default, not an afterthought.
- **Open development.** thmh stays open source with an open, documented manifest schema, and its agent guidance is agent-agnostic (it lives in `AGENTS.md` and `docs/`, not locked to one coding agent), so any MCP-compatible tool can consume a published catalog.

## Constraints and assumptions

- **TypeScript is required for analysis.** Resolving types such as `ComponentProps<typeof Button>` needs the TypeScript type checker, not syntactic parsing alone. Analysis uses ts-morph on the stable TS 6.0 API, which coexists with consumer projects built on TypeScript 7; the adapter boundary lets the analysis API be swapped later.
- **React-first for now.** The prototype and near-term releases target React components using cva. Other frameworks are in scope only as the Future multi-adapter architecture.
- **Vite-plugin-first distribution.** The primary entry point is a Vite plugin that inherits the host app's configuration; a standalone CLI is the fallback for repositories with no Vite host — design-system libraries, and React meta-frameworks such as Next.js that use their own build system (targeted for GA).
- **cva + Tailwind near-term.** The near-term style stack is cva for variants and Tailwind for tokens; other systems come via adapters later.
- **Node.js 24+** across all packages.
- **Agent-agnostic.** No capability is tied to a single coding agent; agent-facing guidance lives in `AGENTS.md` and public docs.

## Open questions

- When and how should the manifest schema be formalized and published as an open specification, and how far should versioning plan ahead? (`schemaVersion` is currently 0.)
- If public/hosted catalogs are offered, what authentication (OAuth, API keys) should the remote MCP use, and in which phase?
- What is the exact interaction-test API shape, and should it track Storybook's `play` contract for easy migration or take an independent path?
- How deep should the Tailwind token dependency graph go before the added depth stops paying off?
- What is the scope of shadcn `registry.json` interop — ingesting shadcn components, emitting thmh manifests, or both — and how do the two schemas evolve if they diverge?
- How should Next.js React Server Components be previewed, if at all — is client-only preview sufficient, or is an RSC-capable renderer needed, and in which phase?

## References

- [class-variance-authority](https://cva.style/) — the variant library thmh analyzes.
- [Vite Plugin API](https://vite.dev/guide/api-plugin.html) — the dev-server integration surface.
- [Model Context Protocol](https://modelcontextprotocol.io/) — the standard for exposing tools to agents.
- Storybook's official MCP addon (`@storybook/addon-mcp`) — the competing approach; a reference for tool naming.
- [Tailwind CSS](https://tailwindcss.com/) — the near-term token and utility source.
- [shadcn/ui](https://ui.shadcn.com/) — target for `registry.json` interop.
- In-repo: [`AGENTS.md`](../AGENTS.md), [`docs/index.md`](index.md), [`docs/tdd.md`](tdd.md), [`CONTRIBUTING.md`](../CONTRIBUTING.md).
