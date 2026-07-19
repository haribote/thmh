---
id: UIP001
title: Catalog page
depends_on: [MAN001, UIC001, UIC002, UIX001, UIX002]
used_by: [INT001]
layer: feature
status: stable
---

# Catalog page

## Overview

The single page at `/__thmh/`. It fetches the catalog, lists every component with its previews and props, and is the whole of the human-facing surface today.

## Requirements

Satisfies, from [ui](../requirements.md#ui):

> Serve a browsable catalog at `/__thmh/`. _(Prototype)_

## Anatomy

The server returns a near-empty shell: a document with a title, an empty mount point, and a module script. Everything visible is built in the browser from the fetched catalog.

```
┌─ /__thmh/ ─────────────────────────────────────────┐
│  thmh catalog                                 h1   │
│                                                    │
│  ┌─ warnings ──────────────────────────────────┐   │  only when
│  │ Warnings                                    │   │  the catalog
│  │ • src/Bad.tsx: cva call is not assigned…    │   │  has any
│  └─────────────────────────────────────────────┘   │
│                                                    │
│  ┌─ section.component ─────────────────────────┐   │
│  │ Button                                 h2   │   │
│  │ src/components/ui/button.tsx      monospace │   │
│  │ A clickable thing.                 optional │   │
│  │                                             │   │
│  │  ── preview ──── UIC002 when it has variants│   │
│  │                  UIX001 alone when it does  │   │
│  │                  not                        │   │
│  │                                             │   │
│  │  ── props table ─────────────────── UIC001  │   │
│  └─────────────────────────────────────────────┘   │
│                                                    │
│  ┌─ section.component ─────────────────────────┐   │
│  │ App …                                       │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

A component section holds its name as a second-level heading, its file path in monospace, an optional description, then the preview and the props table in that order. A component with a variant definition gets the matrix; one without gets a single preview.

Getting there is four steps, and the last of them is what keeps the page current:

```mermaid
flowchart LR
    S["Shell HTML"] --> B["Inject the stylesheet"]
    B --> F["Fetch the catalog"]
    F --> R["Render"]
    R --> E["UIX002: subscribe"]
```

## Behavior

Rendering replaces the mount point's children wholesale, so there is no incremental update and no preserved state between renders.

The catalog is fetched once at startup. Nothing refetches on its own; the only path to new content is [UIX002](UIX002_live-reload.md).

A failure anywhere in startup is caught at the top and logged to the console. The page stays as it was, which for a failure before the first render means an empty white page with no explanation.

There are no controls: no search, no filter, no sort, no routing. Every component is on screen at once, in the order the catalog lists them.

## A11y

Stated honestly, because this project treats accessibility as a default and the current state does not meet it.

**The document has no `lang`.** Neither shell declares one, which leaves assistive technology guessing at the language of the content.

**There is no viewport meta tag**, so a small screen renders the page at desktop width rather than reflowing.

**There are no landmarks.** The content lives in a bare `div`, with no `main`, so there is nothing to skip to and no structure to navigate by region.

**Headings are correct as far as they go**: one `h1`, then an `h2` per component, with no levels skipped.

**The warnings block is not reachable by structure.** It is a `div` introduced by a bold `strong`, not a heading, so it does not appear in a heading list. It is also not a live region, which is right for content present at first paint and wrong the moment warnings start arriving without a reload.

**Contrast passes.** Body text is 17.4:1, the file path 5.74:1, the cva badge 8.06:1, and warning text 15.71:1 — all above the 4.5:1 required for normal text.

**Dark mode is declared but not implemented.** The stylesheet opts in with `color-scheme: light dark` while hardcoding a white background and near-black text. A reader whose system is dark gets browser-rendered parts in dark against a page that stays light, which is worse than not opting in at all.

## Design

The visual hierarchy is flat by construction: a page title, then a stack of equal-weight cards. Nothing is emphasized over anything else because nothing yet distinguishes components from one another.

Within a card the order encodes what a reader wants first — the name, then where it lives, then what it looks like, then what it takes. The preview comes before the props table because seeing the component answers more questions than reading its signature.

The palette is deliberately plain and system-font-based, so a component under review is not competing with the catalog's own styling for attention.

## Notes

**The stylesheet is a string injected at runtime.** It is neither a real stylesheet nor scoped, so a preview's styles and the catalog's styles are only kept apart by the iframe boundary [UIX001](UIX001_preview-sandbox.md) provides.

**Everything scales linearly with component count.** Every component renders every preview iframe at once, subject only to `loading="lazy"`. A catalog of a hundred components is a hundred sections and several hundred frames, and there is no pagination, virtualization, or collapse. Search and filtering, in UIC003, are the first relief.

**A failed fetch is invisible.** The catch logs to the console and leaves the page blank; nothing on screen says that anything went wrong.
