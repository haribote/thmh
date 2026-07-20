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

**`build` takes four options.** `--root` names the directory to analyze, defaulting to the working directory, and `--out` names the file to write, defaulting to `catalog.json` directly under the root; both are resolved to absolute paths. `--include` narrows the analyzed set and `--tsconfig` names the configuration to analyze under. Neither carries a default here: both are passed to [MAN003](../manifest/MAN003_catalog-generation.md) only when given, so the defaults stay in one place.

**Parsing is strict.** Options are read by `parseArgs` from `node:util` with `strict` set, so four malformed invocations fail rather than pass: an option given no value, an option whose value is another option, an unrecognized option, and a positional argument. Each exits non-zero naming what was wrong.

What matters is the mechanism rather than the four cases. Hand-rolled scanning is what let a missing value fall through to a default and an unknown flag change nothing, and adding checks to it would leave the same class of defect one unhandled shape away. Delegating to a parser that has a notion of an invalid argument removes the class.

**The analysis is [MAN003](../manifest/MAN003_catalog-generation.md)**, called with the root and whichever of `--include` and `--tsconfig` were given. The catalog is serialized as JSON indented by two spaces, with a trailing newline, in UTF-8.

**Warnings go to stderr**, one per line, before the summary. A build that skipped a component or a `cva()` call is therefore distinguishable from a clean one in a CI log, which is the only place anyone reads it. The exit status stays zero: a warning reports something skipped, not a build that failed. An analysis that fails outright still raises, and is reported as an error.

**Two lines go to stdout on success**: how many components were analyzed, and where the file was written.

**Every error is caught at the top level** and reported as `thmh: ` followed by the message, on stderr, with a failing exit status. A missing output directory surfaces this way, as the underlying filesystem error.

## Notes

**Warning text is not formatted consistently by its producers**, and printing them puts that on screen. A warning from variant extraction carries an absolute path, while one from assembly carries the root-relative component id, so one build's warnings read as two different kinds of message. This command deliberately prints them unchanged: normalizing here would hide a difference the producers should not have, and the fix belongs with them.

**The output is not reproducible.** Two builds over unchanged sources differ, because the catalog carries a generation timestamp. That is recorded against MAN003, and it is this command's output where it bites.
