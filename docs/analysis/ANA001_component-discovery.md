---
id: ANA001
title: Component discovery
depends_on: []
used_by: [ANA002, ANA005]
layer: foundation
status: stable
---

# Component discovery

## Overview

Finds the components in one TypeScript source file. It answers a single question — which exported declarations are worth documenting — and hands each one to the extraction adapters.

## Requirements

Satisfies, from [analysis](../requirements.md#analysis):

> Discover exported PascalCase components with call signatures. _(Prototype)_

## Design

The input is a ts-morph `SourceFile`; the output is a list of candidates, each pairing a name with the declaration it resolved to.

An exported declaration becomes a candidate when both hold:

- Its exported name begins with an uppercase letter.
- The type of its declaration has at least one call signature.

Where a name resolves to several declarations, only the first is considered. The rest are not examined, and the name is judged entirely by that first declaration.

Discovery is deliberately shallow. It does not check that the declaration returns JSX, does not resolve re-exports to their origin, and does not read the declaration's body. What it produces is a set of *candidates*, and the adapters downstream are responsible for anything that turns out not to be a component.

## Notes

**Any exported PascalCase function is a candidate.** A factory, a class, or a type guard named in PascalCase passes all three checks. Nothing filters it out, so it reaches the manifest as a component with whatever props its first parameter happens to have. Checking the return type for JSX would narrow this, at the cost of coupling discovery to React — which is exactly the coupling ANA006 is meant to remove. The right home for the check is the framework adapter, not this stage, so it stays open until the adapter registry exists.

**Only the first declaration is examined.** `getExportedDeclarations()` returns an array per name, and this stage reads index `0`. A name with a merged declaration (a function plus a namespace, say) is judged by whichever the compiler lists first. No case of this has been observed in practice, and the behavior is recorded rather than defended.
