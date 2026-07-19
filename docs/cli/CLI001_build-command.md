---
id: CLI001
title: build command
depends_on: [MAN001, MAN003]
used_by: []
layer: integration
status: stable
---

# build command

## Overview

`thmh build` analyzes a project once and writes `catalog.json` to disk. It is the path that does not need a dev server, which makes it the one CI and a hosted catalog can use.

## Requirements

Satisfies, from [cli](../requirements.md#cli):

> `thmh build`: generate a static `catalog.json` for CI and hosted catalogs. _(Prototype)_

## Design

The binary dispatches on the first argument. `build` runs; `dev`, `init`, and `mcp` each print that they are not implemented and fail. Anything else prints usage.

Exit status distinguishes three outcomes: invoking `thmh` with no command at all is success, since printing usage is what was asked for; an unrecognized command is a failure; and a recognized but unimplemented command is a failure.

**`build` takes two options.** `--root` names the directory to analyze, defaulting to the working directory. `--out` names the file to write, defaulting to `catalog.json` directly under the root. Both are resolved to absolute paths.

**The analysis is [MAN003](../manifest/MAN003_catalog-generation.md)**, called with the root and nothing else. The catalog is serialized as JSON indented by two spaces, with a trailing newline, in UTF-8.

**Two lines go to stdout on success**: how many components were analyzed, and where the file was written.

**Every error is caught at the top level** and reported as `thmh: ` followed by the message, on stderr, with a failing exit status. A missing output directory surfaces this way, as the underlying filesystem error.

## Notes

**Warnings never reach the user.** The catalog records them and this command writes them to the file, but stdout reports only the component count. A build in which a component failed to analyze, or a `cva()` call was skipped, is indistinguishable from a clean one at the terminal. In CI, where nobody opens the JSON, that is the difference between noticing a regression and not.

**Warning text is not formatted consistently by its producers**, which makes it harder to surface later. A warning from variant extraction carries an absolute path, while one from assembly carries the root-relative component id. Whoever prints them will have to normalize first, and the fix belongs with the producers rather than here.

**An option takes whatever token follows it, including another option.** The parser never asks whether that token is a value. Two consequences follow.

With nothing after it, `thmh build --root` reads the value as absent and falls back to the working directory, reporting success. The same holds for `--out`.

With another option after it, the first swallows the second: `thmh build --root --out out.json` treats `--out` as the directory to analyze and never sees `out.json` at all. The failure that results names a path assembled from the swallowed option, which points at the symptom rather than the mistake.

**Unrecognized options are silently ignored.** The parser looks only for `--root` and `--out` and skips everything else without comment, so a mistyped or unsupported flag changes nothing and still exits successfully. Both this and the previous note come from hand-rolled parsing that has no notion of an invalid argument.

**Analysis cannot be narrowed from the command line.** There is no `--include`, so the analyzed set is whatever [MAN003](../manifest/MAN003_catalog-generation.md) defaults to, and a project whose components are not under `src/**/*.tsx` cannot be built at all. The Vite plugin exposes this as an option; the command does not. There is likewise no way to pass a tsconfig path, though analysis accepts one.

**The output is not reproducible.** Two builds over unchanged sources differ, because the catalog carries a generation timestamp. That is recorded against MAN003, and it is this command's output where it bites.
