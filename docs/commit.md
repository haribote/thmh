# Commit messages

Commits in this repo follow [Conventional Commits](https://www.conventionalcommits.org/). This document is the single source of truth for the format, so both humans and agents write the same style. A squash-merged PR inherits its subject from the PR title, so the same rules apply there.

## Format

```
<type>(<scope>): <subject>
```

The `(<scope>)` is optional. Keep the whole thing to a single line.

## Types

- **feat** — a new feature.
- **fix** — a bug fix.
- **docs** — documentation only.
- **style** — formatting that does not change behavior.
- **refactor** — a code change that neither fixes a bug nor adds a feature.
- **test** — adding or adjusting tests.
- **chore** — chores and tooling.
- **perf** — a performance improvement.

## Scopes

The scope is optional. Per Conventional Commits, it names a section of the codebase — the functional area a change touches, not a whole package. Pick the narrowest area that fits, and omit the scope for repo-wide changes and most docs.

- **Capability areas** — `analysis`, `manifest`, `mcp`, `cli`, `ui`, `integration` (the same areas as the docs domains).
- **Integration** — `vite` (the Vite plugin).
- **Cross-cutting** — `ci` (workflows), `release` (version bumps), `deps` (dependency updates).

Prefer an area over a package name: a change inside `@thmh/core` is usually `analysis`, `manifest`, or `mcp`, not `core`.

Examples: `feat(analysis): extract compound variants`, `fix(cli): correct the package name`, `chore(ci): add the publish workflow`.

## Subject rules

- **English, imperative mood** — "add", not "added" or "adds".
- **Lowercase start, no trailing period.**
- **50–72 characters** as a guide.
- **One line only.** Do not narrate trial-and-error or restate implementation details.

## Breaking changes

Mark a breaking change with a `!` — e.g. `feat!: ...` — or add a `BREAKING CHANGE:` footer.

## Non-negotiable rules

- **No emoji.**
- **No AI co-author credits.**
- **Do not bullet-list implementation details** in the message — keep it concise, not a changelog.
- A repo-specific rule here overrides any agent's default commit convention.

## Reference

The format follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.
