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

The server returns a near-empty shell: a document with a title, an empty mount point, and a module script. The mount point is the page's `main` landmark, so the region and the render target are one element rather than two. Everything visible is built in the browser from the fetched catalog.

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

Stated honestly, including where the page still falls short.

**The document declares `lang="en"`.** The catalog's own text — the heading, the column names, the warnings — is English, so that is what it declares. The component names and descriptions it renders come from the reader's own source and may be anything; nothing marks those individually, which is a limit worth knowing rather than a gap to close here.

**A viewport meta tag lets the page reflow** instead of rendering at desktop width on a small screen.

**The content sits in a `main` landmark.** It is the mount point itself, so there is one region and it holds everything the page renders. That is enough to skip to; it is not yet enough to navigate *by*, which would need the component list to be its own region once there is more than one.

**Headings are correct as far as they go**: one `h1`, then an `h2` per component, with no levels skipped.

**The warnings block is not reachable by structure.** It is a `div` introduced by a bold `strong`, not a heading, so it does not appear in a heading list. It is also not a live region, which is right for content present at first paint and wrong the moment warnings start arriving without a reload.

**Contrast passes in both schemes.** Light: body text 17.40:1, file path 5.74:1, cva badge 8.06:1, warnings 15.71:1. Dark: 15.03:1, 7.18:1, 7.64:1, 10.93:1. All are above the 4.5:1 required for normal text, and every value was computed rather than judged by eye.

**The page follows the reader's environment.** `color-scheme: light dark` is now backed by a `prefers-color-scheme` block, so what the browser renders and what the stylesheet renders agree. There is no way to override the environment; that arrives with the controls in UIC003.

## Design

The visual hierarchy is flat by construction: a page title, then a stack of equal-weight cards. Nothing is emphasized over anything else because nothing yet distinguishes components from one another.

Within a card the order encodes what a reader wants first — the name, then where it lives, then what it looks like, then what it takes. The preview comes before the props table because seeing the component answers more questions than reading its signature.

The palette is deliberately plain and system-font-based, so a component under review is not competing with the catalog's own styling for attention.

Both schemes are built from the same four roles — surface, text, muted text, and border — so the dark palette is a substitution rather than a second design. Preview frames follow the catalog's scheme rather than staying light, on the grounds that a reader working in dark wants to see the component as it will appear there. That places a burden on the component: one built for a light surface will look wrong, and the catalog gives no way to say so yet. A per-preview background control belongs with UIC003, where the page gains controls at all.

## Notes

**The stylesheet is a string injected at runtime.** It is neither a real stylesheet nor scoped, so a preview's styles and the catalog's styles are only kept apart by the iframe boundary [UIX001](UIX001_preview-sandbox.md) provides.

**Everything scales linearly with component count.** Every component renders every preview iframe at once, subject only to `loading="lazy"`. A catalog of a hundred components is a hundred sections and several hundred frames, and there is no pagination, virtualization, or collapse. Search and filtering, in UIC003, are the first relief.

**A failed fetch is invisible.** The catch logs to the console and leaves the page blank; nothing on screen says that anything went wrong.
