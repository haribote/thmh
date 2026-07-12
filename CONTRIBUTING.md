# Contributing to thmh

## Lifecycle Scripts

A PR that adds `preinstall`, `install`, or `postinstall` to any `packages/*/package.json` is rejected by default.
Two reasons deserve stating:

1. **Runtime execution.** These scripts execute on the consumer's machine at install time, running arbitrary code from this repository.
2. **Silent failure under `--ignore-scripts`.** Consumers can disable script execution with `npm install --ignore-scripts`, so any functionality placed in lifecycle scripts is simply broken for those users. Code run at install time should not be a default entry point for functionality.

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
