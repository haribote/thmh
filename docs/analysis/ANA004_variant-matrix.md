---
id: ANA004
title: Variant matrix
depends_on: [ANA003, MAN001]
used_by: [ANA005]
layer: foundation
status: stable
---

# Variant matrix

## Overview

Turns a variant definition into the axes it declares, and turns a set of axes into every combination of their options. This is the derivation behind "show me every variant of this component".

## Requirements

Satisfies, from [analysis](../requirements.md#analysis):

> Generate the full variant matrix for each component. _(Prototype)_

## Design

Two pure functions over data, with no dependency on ts-morph or on any framework.

**Deriving axes.** A variant definition becomes a list of axes, each an axis name and its option names. Axes and options are normally in the order they were written in the source, so a catalog that renders them reads in the order the author chose rather than alphabetically.

That ordering has one exception, and it is not one this stage can fix. Axes and options are carried in plain objects keyed by name, and JavaScript enumerates integer-like keys first, in ascending numeric order, whatever order they were inserted in. Since [ANA003](ANA003_cva-variant-adapter.md) accepts numeric literals as names, an axis written `{ 2: …, 1: …, 10: … }` is reported as `1, 2, 10`. Only names that look like integers are affected; every other name keeps its source order.

**Producing the matrix.** A list of axes becomes a list of combinations, each mapping every axis name to one of its options. The result is the cartesian product: its length is the product of the option counts. Two edge cases follow from that definition and are worth stating, because a caller will meet them:

- An empty list of axes yields one combination, the empty one. A component with no variants has exactly one rendering, not zero.
- An axis with no options yields no combinations at all, since the product is zero.

Combination keys appear in axis order, and the combinations themselves vary the last axis fastest.

## Notes

**The matrix function has no production caller.** `cartesianProduct` is exported and tested, but nothing in the packages calls it. The catalog UI derives its own axes and builds its own grid in `packages/vite/src/client/ui.ts`, and the CLI never needs the matrix at all. So the requirement it satisfies is met by an unused function while the shipped behavior lives somewhere else, in a second implementation.

That is the duplication this project treats as a defect, and it should be resolved rather than documented indefinitely. Two directions are open: have the UI consume this function, or record the matrix in the manifest so both the UI and the MCP tools read one derivation. The choice belongs with [MAN001](../manifest/MAN001_catalog-schema.md) and UIC002, since it changes what the manifest carries.

**Axis derivation reads a cva definition specifically.** Once the variant adapter interface in ANA006 admits a second variant system, this signature has to widen to whatever that interface yields.
