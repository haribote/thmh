---
id: ANA003
title: cva variant adapter
depends_on: []
used_by: [ANA004, ANA005]
layer: feature
status: stable
---

# cva variant adapter

## Overview

Reads `cva()` calls out of a source file and turns each into a variant definition: its base classes, its axes and their options, its defaults, and its compound variants. This is what lets thmh enumerate variants without a Story file.

## Requirements

Satisfies, from [analysis](../requirements.md#analysis):

> Analyze cva variant definitions and extract axes, options, defaults, and compound variants. _(Prototype)_

## Design

The input is a ts-morph `SourceFile`; the output is a list of extracted calls and a list of warnings.

**Finding the calls.** Only `cva` imported from the package `class-variance-authority` counts, and an import alias is honored — `import { cva as tv }` makes `tv(…)` a match. A `cva` imported from anywhere else is ignored entirely. Every call expression in the file whose callee is one of those identifiers is a candidate.

**Binding the call to a name.** A call must be the initializer of a variable declaration. One that is not (a `cva()` passed straight into another call, for instance) produces a warning and is skipped. The variable's name becomes the call's local name, which [ANA005](ANA005_manifest-assembly.md) uses to associate the call with a component. The export name is recorded only when the enclosing variable statement is exported.

**Evaluating the arguments.** This is a literal evaluator over the AST, not an interpreter. It reads what is written in the source and resolves nothing:

- **base** (first argument) is a string literal or a template literal with no substitutions. An array of those is joined with a single space. Anything else warns, and the base is left unset.
- **variants** is an object of axes, each an object of options. An axis or option name may be an identifier, a string literal, a template literal with no substitutions, or a numeric literal. An option's value may be a string, a template literal with no substitutions, `true`, `false`, or a number; booleans and numbers are recorded as their source text.
- **defaultVariants** is an object of axis names to scalar values, read by the same rules.
- **compoundVariants** is an array of objects. Within each, a `class` or `className` key supplies the class string and every other key becomes a condition. An entry is dropped when it yields no class string, and also when any one of its properties is unreadable — an unreadable condition discards the whole entry, class string and all.

**Handling what it cannot read.** An unsupported node produces a warning naming the file, the section, and the node kind, and that one node is skipped. The surrounding cva is still extracted. A file with one unreadable option still yields its other options rather than nothing.

## Notes

**Only literals are read.** A spread, an identifier reference to a shared object, a template literal with substitutions, or a value computed by a function is unreadable, and warns. This is the deliberate trade: a literal evaluator cannot be wrong about what it reports, where an interpreter could be.

**Only `class-variance-authority` is recognized.** `tailwind-variants`, `cva` re-exported through a project's own module, and Panda's recipes all go unseen. Supporting them is what the variant adapter interface in ANA006 is for; hard-coding the package name here is the thing that interface removes.

**Boolean and numeric options become strings.** `size: { 1: "…" }` and `disabled: { true: "…" }` both reach the manifest as string keys. [ANA005](ANA005_manifest-assembly.md) recovers the boolean case when it synthesizes a prop type, but the numeric case stays a string union.

**A warning does not identify which cva call it came from.** Warnings carry the file path and the section name, so a file with two `cva()` calls produces warnings that cannot be attributed to one of them.
