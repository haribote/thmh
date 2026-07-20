---
id: MAN001
title: Catalog schema
depends_on: []
used_by: [ANA002, ANA003, ANA004, ANA005, MAN002, MAN003, CLI001, MCP001, MCP002, UIP001, UIC001, UIC002]
layer: foundation
status: stable
---

# Catalog schema

## Overview

The shape of `catalog.json`. Every consumer reads this and nothing else: the catalog UI, the CLI's output file, and the MCP tools beta adds. It is the contract the rest of the project is arranged around.

## Requirements

Satisfies, from [manifest](../requirements.md#manifest):

> Produce a `catalog.json` capturing components, props, variants, defaults, and dependencies. _(Prototype)_

## Design

A catalog is a envelope around a list of component records.

**The envelope** carries `schemaVersion`, a `generator` string naming what produced it, a `generatedAt` ISO timestamp, the `components`, and a flat list of `warnings`.

**A component record** carries an `id`, a `name`, the `filePath` it was found in, an optional `description`, its `props`, and an optional variant definition under `cva`. The id is the file path and the name joined by `#`, which makes it unique within one catalog and stable across platforms.

**A prop** carries a `name`, its `type` as text, whether it is `required`, an optional `defaultValue` and `description`, and a `source`. The source is `declared` for a prop read off the component's own signature and `cva` for one synthesized from a variant axis, so a consumer can tell which props the author wrote from which thmh inferred.

**A variant definition** carries an optional `exportName`, an optional `base` class string, the `variants` as an axis-to-option-to-class mapping, optional `defaultVariants`, and optional `compoundVariants`. A compound variant is a set of `conditions` and the `className` they select.

Types are text, not structure, and the text comes from two different places. For a `declared` prop it is what the TypeScript checker printed, after [ANA002](../analysis/ANA002_react-props-adapter.md) strips a `| undefined` member and truncates past 200 characters. For a `cva` prop the checker is not involved at all: [ANA005](../analysis/ANA005_manifest-assembly.md) synthesizes the text from the axis options, as a union of quoted literals or as `boolean`. A consumer can display either but cannot reason about it without parsing, and cannot tell from the field alone which of the two it is reading — only `source` says that.

## Notes

**`schemaVersion` is the literal `0`, not a number.** The field is typed as the literal, so changing it is a breaking type change for anything compiled against `@thmh/core`, and no value other than `0` can be represented. Nothing yet defines what bumping it would mean or what a consumer should do on a mismatch. That is the subject of MAN005, and it has to be settled before the Tailwind token adapter adds fields.

**`warnings` carries two different things.** A warning about one component sits in the same flat list as the message from an analysis that failed outright, and neither is tagged. A consumer cannot distinguish "the catalog is complete, with three notes" from "analysis crashed and this catalog is empty". Component-level warnings also carry their component's id only by convention, inside the message string.

**`generator` has no agreed format.** `@thmh/core` writes `@thmh/core@0.0.0` and `@thmh/vite` writes `@thmh/vite`, so the field is sometimes versioned and sometimes not. See MAN003 for how the core value drifted from the real package version.

**Nothing describes tokens or dependencies.** The requirement above names dependencies, and the schema has no field for them. The component-to-token dependency graph beta calls for has nowhere to go, which is part of why adding the Tailwind adapter forces a schema change.

**`AnalyzeOptions` lives here too**, carrying `root`, an optional `tsconfigPath`, and an optional `include`. It has no field for adapters, so there is no way to register one; ANA006 adds it.
