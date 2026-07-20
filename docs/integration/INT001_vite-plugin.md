---
id: INT001
title: Vite plugin
depends_on: [MAN002, UIP001, UIX001]
used_by: [CLI002, CLI003, MCP001]
layer: integration
status: stable
---

# Vite plugin

## Overview

The one thing a consumer installs. It attaches thmh to an existing Vite dev server, so the catalog inherits the app's own aliases, CSS pipeline, and environment instead of asking for a second build configuration.

## Requirements

Satisfies, from [integration](../requirements.md#integration):

> Run as a Vite plugin inheriting the host app's config (aliases, CSS, environment). _(Prototype)_

## Design

The plugin is a factory taking two options and returning a Vite plugin object. `include` overrides which files are analyzed; `css` names the stylesheet the preview loads, defaulting to `/src/index.css`.

It applies only to `serve`. Under `vite build` it is inert: no hook runs, and nothing is emitted.

```mermaid
flowchart TD
    C["configResolved"] --> R["Record the resolved root"]
    R --> S["configureServer"]
    S --> A["MAN002: create and start the analyzer"]
    S --> W["Subscribe to the server's watcher"]
    S --> M["Mount the /__thmh/ middleware"]
    W -->|"add, change, unlink<br/>of a watched file"| I["analyzer.invalidate()"]
    S -.-> V["resolveId / load<br/>serve the virtual preview entry"]
```

**The root comes from the resolved config**, not from the process. The field is initialized to the current working directory, but Vite resolves configuration before it creates the server, so `configResolved` always supplies the real root before anything reads it. Running the dev server from a directory other than the project root still produces paths relative to the project root.

**The watcher is the server's own**, subscribed through its `all` event rather than through `handleHotUpdate`. Only `add`, `change`, and `unlink` count. A file qualifies when its name ends in `.ts` or `.tsx` and no segment of its path is `node_modules`, `dist`, or `.git`. Every qualifying event calls `invalidate`, and the debouncing is [MAN002](../manifest/MAN002_dev-manifest-refresh.md)'s concern, not this one's.

**The preview entry is a virtual module.** `resolveId` claims one well-known id and `load` returns generated source for it, closing over the configured `css` path. Because the module goes through Vite, the preview gets the host's transforms — including the React Refresh preamble the middleware injects.

**What the plugin requires of its host is declared, not assumed.** Vite is a peer dependency because the plugin is one. React and React DOM are peer dependencies because the preview entry renders with them ([UIX001](../ui/UIX001_preview-sandbox.md)), so a host without them cannot serve a preview at all. They are peers rather than dependencies because the preview renders the host's components with the host's React; a second copy would be a second React.

React lives here and not in `@thmh/core` because this is the Rendering layer. `@thmh/core` is the framework-independent half and depends on neither. A rendering adapter that admits other frameworks would make these peers optional; that is Future work, and until then the constraint is real and stated.

## Notes

**Nothing is torn down when the server closes.** The watcher subscription is never removed and a pending debounce timer is never cleared. In a long-lived process that restarts servers, such as a test run, analyzers accumulate.

**The default `include` lives somewhere else.** Leaving the option unset passes `undefined` through to analysis, which applies its own default of `src/**/*.tsx`. So the plugin's documented default is not written in the plugin, and a reader has to follow the value into `@thmh/core` to learn what it is.

**Exclusion is by path segment, so it over-matches.** A directory legitimately named `dist` inside `src` is skipped along with build output. The rule cannot tell a project's source directory from a build artifact of the same name.

**The `css` default is a convention, not a discovery.** A project whose stylesheet is not at `/src/index.css` gets a preview that fails to load it until the option is set. Nothing inspects the project to find out.

**Watching is broader than the module graph.** Using the raw watcher means edits to files Vite never loaded still trigger analysis, which is what makes a component in an unimported file appear in the catalog. It also means edits to unrelated `.ts` files cost a full re-analysis.

**Build-time output is out of scope here.** Because the plugin is serve-only, the only way to get a static `catalog.json` is the CLI, described by CLI001.

**The plugin is where the catalog is assembled.** It mounts the routes that serve [UIP001](../ui/UIP001_catalog-page.md) and [UIX001](../ui/UIX001_preview-sandbox.md), and it is the only place those two and the analyzer meet. Nothing else in the graph composes them, which is why an integration-layer document depends on feature-layer ones rather than the other way round.
