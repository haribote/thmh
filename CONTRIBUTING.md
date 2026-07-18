# Contributing to thmh

## Documentation

All project documentation lives under `docs/`, and is written in **English**. The entry point is [`docs/index.md`](docs/index.md), a link hub referenced from the README.

### Layout

```
docs
├ index.md              # link hub for everything under docs/
├ requirements.md       # What is built, and Why. No How.
├ <domain>/
│ ├ index.md            # list of that domain's feature documents
│ └ {ID}_slug.md        # a single feature's spec and design
└ ui/
  ├ index.md
  └ {ID}_slug.md        # a screen, layout, component, or off-screen feature
```

Feature domains are organized by capability: `analysis`, `manifest`, `mcp`, `cli`, `integration`, and `ui`.

- `requirements.md` holds **What** (the capabilities to build) and, as context, **Why**. It never describes How.
- A feature document (`{ID}_slug.md`) holds that one feature's spec and design — the **How** — and links back to the requirement it satisfies.
- Each `<domain>/index.md` lists its feature documents. These indexes are maintained by hand for now (a candidate for later automation).

### Feature IDs

A file is named `{feature-id}_{kebab-slug}.md`. The **feature ID** is `{CODE}{NNN}` — the part before the underscore — and is distinct from the slug and the filename. Cross-references (`depends_on` / `used_by`, below) use the feature ID, never the filename.

- **CODE** is a three-letter uppercase code.
  - By domain: `ANA` (analysis), `MAN` (manifest), `MCP`, `CLI`, `INT` (integration).
  - The `ui` domain splits by kind: `UIC` (component), `UIL` (layout), `UIP` (page), `UIX` (other — features that never appear on screen, e.g. the catalog BFF connection).
- **NNN** is a zero-padded three-digit sequence, numbered independently per CODE (each prefix starts at `001`).
- **slug** is a descriptive kebab-case name.

Examples: `MCP001_search-components.md`, `ANA001_cva-adapter.md`, `UIP001_catalog-page.md`. `index.md` and `requirements.md` are fixed names and carry no feature ID.

The CODE duplicates the directory, but this is deliberate: `MCP001` is a path-independent, stable handle you can cite from other documents or from code.

### Front matter

Every feature and UI document begins with YAML front matter:

```yaml
---
id: MCP001
title: search_components
depends_on: [MAN001]   # feature IDs this feature depends on
used_by: [UIP001]      # feature IDs that use this feature
layer: feature         # optional: foundation | feature | integration
status: draft          # optional: draft | stable | ...
---
```

`depends_on` and `used_by` express the dependency graph between features. Their values are **feature IDs**, not filenames. The two are inverse directions of the same edge, so keep them consistent (a candidate for later automation, like the indexes).

### Templates

Every domain directory holds a `_template.md` with that domain's front matter and section skeleton (`docs/<domain>/_template.md`). **When you create a document, you must start from its domain's `_template.md`** — copy it to `{ID}_slug.md`, assign the feature ID, and fill in the sections. Do not hand-roll a document from scratch.

`_template.md` is not a feature document; it carries no real feature ID and is never listed in a domain's `index.md`.

## Development rules

These are project laws. They apply to every contributor, human or agent.

### Design before implementation

**No feature is implemented without a design.** Before writing implementation code for a feature, a design document for it must exist at `docs/<domain>/{id}_slug.md`, with its requirement recorded in `docs/requirements.md`. If you are asked to implement something that has no design document, design it first — write the document and have it reviewed — and only then implement. The documentation is the source of truth, and it precedes the code.

### t-wada style TDD

Development follows the classic, strict TDD cycle (**Red → Green → Refactor**), one test at a time. The full procedure — the cycle, the non-negotiable rules, and the test commands — is documented in [docs/tdd.md](docs/tdd.md). Follow it whenever you write production code.

## Issues and pull requests

**Non-English speakers are welcome here.** You do not need fluent English to contribute — write issues and pull requests starting in your native language, and using translation tools to produce the required versions is fine.

Issues and pull requests are multilingual. Write each one starting in the author's native language, and **always include both Japanese and English**. Order the language blocks with the native language first, then Japanese, then English: a Japanese-native author writes Japanese then English (the familiar `English follows Japanese.`), an English-native author writes English then Japanese, and an author whose native language is neither leads with it, then Japanese, then English. Separate the blocks with a `---` rule, open with a line stating the reading order, and mirror every block one-to-one.

- **Issues** use a background/tasks structure (`## 背景` / `## タスク`, mirrored as `## Background` / `## Tasks`). The step-by-step procedure and template are in [docs/issue.md](docs/issue.md).
- **Pull requests** state what changed and how it was verified (`## 変更内容` / `## 動作確認` / `## 関連`, mirrored in English) and link their issue with `Closes #NN`. The full lifecycle and template are in [docs/pr.md](docs/pr.md).

GitHub pre-fills these skeletons from [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE) and [`.github/pull_request_template.md`](.github/pull_request_template.md), which are their single source of truth.

Branches are named `type/topic` in kebab-case, where `type` is a Conventional Commits type (e.g. `docs/architecture`, `fix/thmh-cli-package-name`). Cut each branch from the latest `main`.

Pull requests are **squash-merged**: the squashed commit subject is the PR title with the PR number appended (e.g. `docs: write the architecture document (#32)`), and the branch is deleted after the merge lands.

Commit messages and PR titles follow Conventional Commits; the full rules are in [docs/commit.md](docs/commit.md).

## Lifecycle Scripts

A PR that adds `preinstall`, `install`, or `postinstall` to any `packages/*/package.json` is rejected by default.
Two reasons deserve stating:

1. **Code execution on the consumer's machine.** These scripts run at install time, in the environment of whoever installs the package.
2. **Breakage under `--ignore-scripts`.** Consumers can install with `npm install --ignore-scripts`, which skips these scripts entirely, so any functionality placed in them is broken for those users.

None of the three packages today has such a script. This policy records the status quo rather than introducing a new constraint.

Similarly, when reviewing a PR that adds a new dependency, check `pnpm-workspace.yaml` for `allowBuilds` entries.
pnpm blocks dependencies' build scripts by default and requires explicit opt-in via `allowBuilds`.
Currently, only `esbuild` is listed:

```yaml
allowBuilds:
  esbuild: true
```

A PR whose new dependency requires an addition there must explain why that dependency needs a build script and why no prebuilt alternative exists.
Reviewing that diff carries the same weight as reviewing our own manifests — it is a gate through which code runs on the consumer's machine.

## Releasing

Releases follow this process:

1. **Bump versions in lockstep.**
   The three packages (`@thmh/core`, `@thmh/vite`, `@thmh/cli`) declare versions in their `packages/*/package.json`, and depend on each other via `workspace:*`.
   pnpm rewrites `workspace:*` to the real version at pack time.
   Versions must not diverge.
   Update all three, then run `pnpm install --lockfile-only` to update the lockfile, and land the bump on `main` as a PR.

2. **Create a GitHub Release.**
   Tag it with `v<version>` (e.g. `v0.1.0` or `v0.1.0-next.0`).
   For example:
   ```bash
   gh release create v0.1.0 --generate-notes
   ```
   For a prerelease, add `--prerelease`:
   ```bash
   gh release create v0.1.0-next.0 --generate-notes --prerelease
   ```

3. **Publishing fires automatically.**
   `.github/workflows/publish.yml` listens for the release `published` event.
   It checks out the tag, derives the version by stripping the `v` prefix, and verifies that all `packages/*/package.json` declare that version.
   If they do not, the job fails with an error message naming the mismatched file.

4. **Dist-tag is determined from the version string.**
   If the version contains a hyphen (e.g. `0.1.0-next.0`), it is published to the `next` dist-tag.
   Otherwise, it goes to `latest`.

5. **Approval is required before publishing.**
   The job runs in the `npm-publish` GitHub environment.
   Publishing does not proceed until an approver with access to that environment permits it.

### Consequences

**Who can publish reduces to who can create a GitHub Release, plus the `npm-publish` environment settings.** There is no long-lived npm token in this repository.

**There is no procedure for moving a dist-tag from `next` to `latest`.** Promotion means publishing one stable version to `latest`. If a prerelease was published to `next` and you want to make it stable, bump the version (remove the hyphen) and publish again.
