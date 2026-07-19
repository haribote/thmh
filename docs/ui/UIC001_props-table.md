---
id: UIC001
title: Props table
depends_on: [MAN001]
used_by: [UIP001]
layer: feature
status: stable
---

# Props table

## Overview

The table under each component listing what it accepts: every prop's name, type, whether it is required, its default, and its description.

## Requirements

Satisfies, together with [UIC002](UIC002_variant-matrix-grid.md), from [ui](../requirements.md#ui):

> Show the variant matrix and a props table (name, type, required, default, description). _(Prototype)_

## Anatomy

One table, five columns, in the order the requirement names them: name, type, required, default, description.

One row per prop, in the order the catalog lists them — declared props first, then the ones synthesized from variant axes, since that is the order [ANA005](../analysis/ANA005_manifest-assembly.md) produces.

A prop whose source is `cva` carries a small badge next to its name. That badge is the only thing distinguishing a prop the author wrote from one thmh inferred, and it exists because the distinction changes how much a reader should trust the type.

## Behavior

The table is static. Nothing sorts, filters, expands, or wraps a long type; the cell simply grows.

A missing default or description renders as an empty cell rather than a placeholder. `required` renders as the literal `true` or `false`.

## A11y

**Header cells are marked up as header cells**, and each declares `scope="col"`. With a single header row a screen reader would usually infer that anyway; declaring it removes the inference.

**The table has an accessible name**, from a caption naming the component whose props it lists. Without it, a reader moving from table to table hears a series of identical unnamed tables. The caption is visually hidden: the component's name is already in the heading above, so showing it again would be redundant on screen while remaining the only thing that distinguishes the tables to a screen reader.

**There is still no `thead` or `tbody`.** Nothing depends on them here — the table is one header row and a body — but their absence means the header row is not marked as a group.

**The cva badge conveys meaning through a visual token.** It is a `span` with text content `cva`, so the text is read out, but nothing explains what it means. It reads as the bare word "cva" appended to a prop name.

**Contrast passes.** The badge is 8.06:1 against its own background, and body text is 17.4:1.

## Design

Five columns in the requirement's order, left-aligned, top-aligned, at a size smaller than body text. The table is reference material — something a reader scans for one row rather than reads through — so it recedes relative to the preview above it.

The badge is the only color in the table. That is deliberate: it marks the one distinction a reader cannot recover from the other columns.

## Notes

**A long type expands the column rather than truncating.** Types are already capped at 200 characters by [ANA002](../analysis/ANA002_react-props-adapter.md), so the worst case is bounded, but a 200-character type still stretches the layout.

**Nothing marks a truncated type as truncated.** The ellipsis that ANA002 appends is the only signal, and it is indistinguishable from a type that genuinely ends that way.

**The badge says where a prop came from but not what that implies.** A `cva` prop's type is synthesized from the axis options and its description is always absent, both of which follow from its origin and neither of which the table explains.
