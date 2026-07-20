---
id: INT002
title: TypeScript project resolution
depends_on: []
used_by: [MAN003]
layer: foundation
status: stable
---

# TypeScript project resolution

## Overview

Builds the ts-morph project that analysis reads from: which compiler options apply, and which files are in it. Everything thmh knows about a component comes through the type checker this sets up, so what the checker cannot see, the catalog cannot describe.

## Requirements

Satisfies, from [integration](../requirements.md#integration):

> Analyze through the stable ts-morph (TS 6.0) API, compatible with consumer projects on TypeScript 7. _(Prototype)_

## Design

Two steps, deliberately separate: decide the compiler options, then decide the files.

**Compiler options** come from the consumer's own tsconfig where one can be found. The search is ordered and stops at the first hit:

1. An explicit path, when the caller supplies one.
2. `tsconfig.app.json` under the root.
3. `tsconfig.json` under the root.

`tsconfig.app.json` is tried first because Vite's own React templates split their configuration that way, putting the browser sources in `tsconfig.app.json` and the build tooling in a sibling. Preferring it means a scaffolded project is analyzed with the options that apply to its components rather than to its config files.

When a tsconfig is found, its files are deliberately *not* loaded. The project takes the options and nothing else.

When none is found, the project falls back to a fixed set: `strict`, `jsx` as the automatic React runtime, bundler module resolution, and an ES2022 target.

**Files** are added explicitly, by matching the caller's globs against the root and adding exactly what matches. Nothing else enters the project. Resolving types lets the checker read declarations from elsewhere, but those files are never added, so a walk over the project's source files never reaches into `node_modules` or a dependency's sources.

## Notes

**The fallback options hardcode React.** A project with no tsconfig is analyzed as if it used the automatic React JSX runtime, in a module whose domain is meant to be framework-independent. It is a small instance of the coupling ANA006 exists to remove, and it is worth revisiting when the adapter registry lands, since the framework adapter is a better place to decide what a JSX file means.

**An explicit path is trusted; a conventional one is checked.** The two conventional filenames are tested for existence before being used, so a project without them falls back silently. An explicit path is returned without that test, so a caller who names a file that is not there gets an error rather than the fallback. The two ways of arriving at "no usable tsconfig" therefore end differently, and neither outcome is announced as a choice.

**Only two conventional filenames are tried.** A project that splits its configuration some other way, or that keeps its tsconfig outside the root, is analyzed with the fallback options unless the caller passes an explicit path. Nothing warns that this happened, so a project can be analyzed under options it never chose and the only visible symptom is a component whose types come out wrong.

**Solution-style configurations are not followed.** A tsconfig consisting mostly of `references` supplies few useful options, and the referenced projects are not consulted.

**A malformed or missing tsconfig throws.** The error leaves this stage and propagates through [MAN003](../manifest/MAN003_catalog-generation.md), where the dev server converts it into an empty catalog and the CLI exits.

**The stable-API constraint is a promise, not a mechanism.** The requirement is to analyze through the ts-morph API that remains stable across the TypeScript 7 transition. Nothing in this code enforces or checks that; it is honored by what the surrounding code chooses to call. This is accepted: a mechanism that could enforce it would have to model which of ts-morph's surface is stable, and that model would go stale faster than the constraint it guards.
