---
id: ANA002
title: React props adapter
depends_on: [ANA001]
used_by: [ANA005]
layer: feature
status: stable
---

# React props adapter

## Overview

Reads a candidate's props off its first parameter through the TypeScript type checker, together with the JSDoc attached to the component and to each prop.

## Requirements

Satisfies, from [analysis](../requirements.md#analysis):

> Extract component props, types, and JSDoc from TypeScript sources via the type checker. _(Prototype)_

## Design

The input is a candidate from [ANA001](ANA001_component-discovery.md) and a `TypeChecker`; the output is an optional component description and a list of props.

**The component description** comes from the JSDoc on the declaration: for a function declaration, its own JSDoc; for a variable declaration, the JSDoc on the enclosing variable statement. Only the first JSDoc block is read.

**The props** come from the properties of the first parameter's type. A component with no call signature, no first parameter, or no value declaration for that parameter yields no props, and this stage does not treat it as an error.

That tolerance is local to this stage. The association step in [ANA005](ANA005_manifest-assembly.md) reads the same parameter and does throw when it has no value declaration, so a component with a union-typed signature ends up as a warning rather than as a component with zero props.

Each property is kept only if at least one of its declarations is a property signature or a property declaration that does not live under `node_modules`. This filter is what keeps `React.ButtonHTMLAttributes` and its hundreds of members out of the manifest while letting through the props a `VariantProps<typeof …>` mapped type contributes, since those resolve back to property assignments in a local object literal.

For each surviving property:

- **required** is the negation of the symbol's optionality.
- **type** is the checker's text for the property. For an optional prop, a `| undefined` member is removed from the union, since the optionality is already carried by `required`. Removing it is skipped when it would leave nothing, so a prop whose type is `undefined` and nothing else keeps that text. The result is truncated to 200 characters, with a `…` appended when it was cut.
- **defaultValue** is the text of the `@default` JSDoc tag when present. Failing that, if the parameter is destructured, it is the initializer for that name in the object binding pattern. A prop with neither has no default.
- **description** is the first JSDoc description found among the property's declarations.
- **source** is `declared`, distinguishing these from the props [ANA005](ANA005_manifest-assembly.md) synthesizes from variant axes.

## Notes

**Props declared through local mapped or utility types are dropped.** The filter demands a property signature or property declaration, and a locally defined `Omit<…>` or mapped type produces neither. This is a known cost of keeping `node_modules` members out, and the code says so at the filter. A more precise rule would compare declaration origins against the component's own source file rather than testing for a syntax kind.

**Truncation is silent in the type text but visible in the output.** A type longer than 200 characters ends in `…`, and there is no field recording that truncation occurred. A consumer cannot distinguish a truncated type from one that genuinely ends in that character.

**Only the first JSDoc block is read**, both for the component and for each prop. A declaration carrying several JSDoc comments contributes only the first.
