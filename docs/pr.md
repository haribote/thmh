# Handling a pull request

This project ships every change through a pull request, from the branch it is cut on to the moment its branch is deleted. The point is not ceremony — it is that each PR carries a self-contained, multilingual record of what changed and how it was verified, so both the human reviewer and the next agent can trust it. Like issues, a PR body starts in the author's native language and always includes both Japanese and English. Contributor-facing policy (branch naming, merge policy) lives in [CONTRIBUTING.md](../CONTRIBUTING.md); this document is the step-by-step procedure an agent follows.

## The lifecycle (always in this order)

1. **Cut a branch from the latest `main`.**
   - Fetch and fast-forward `main` first, so you branch from current tip, not a stale local copy.
   - Name the branch `type/topic` in kebab-case, where `type` is a Conventional Commits type — e.g. `docs/architecture`, `chore/dependabot-npm`, `fix/thmh-cli-package-name`.

2. **Implement and commit.**
   - Follow the repo's commit convention (Conventional Commits, one-line subject) — see [docs/commit.md](commit.md).
   - When writing production code, follow [docs/tdd.md](tdd.md): Red → Green → Refactor, one test at a time.
   - Keep commits scoped; do not mix unrelated changes into one PR.

3. **Open the PR.**
   - Assemble the body from the skeleton in [Template](#template). It always includes both Japanese and English, starting in the author's native language, then Japanese, then English — separate the blocks with a `---` rule and open with a line stating the reading order (e.g. `English follows Japanese.`).
   - Include `Closes #NN` so the PR links and closes its issue.
   - Set the PR title as a Conventional Commits subject; it becomes the squashed commit subject.

4. **Review.**
   - Address review feedback in follow-up commits on the same branch.
   - Keep the branch current with `main` (merge or rebase) so the merge is clean and checks run against current tip.

5. **Squash merge.**
   - Merge with squash so history stays one commit per PR.
   - The squashed commit subject is the PR title with the PR number appended, e.g. `docs: write the architecture document (#32)`.

6. **Delete the branch** after the merge lands.

## Template

The skeleton lives in [`.github/pull_request_template.md`](../.github/pull_request_template.md) — the single source of truth, so GitHub pre-fills it in the web UI and `gh pr create` picks it up. It carries `## 変更内容` / `## 動作確認` / `## 関連` and their English mirror (`## What this changes` / `## Verification` / `## Related`).

- **Add a rationale section when it helps.** Between 変更内容 and 動作確認, an optional section can explain the approach or a design decision; its heading varies per PR (e.g. `## 書き方の方針`). Mirror it on both sides.
- **Reorder by native language.** The template shows the Japanese-native case; an English-native author leads with the English block, and any other native language leads before Japanese and English.

## Non-negotiable rules

- Any "tests pass" or "checks pass" claim must come from an actually-run command, never from a guess.
- Always include `Closes #NN` so the PR links and closes its issue.
- Japanese and English are both required; every language version mirrors one-to-one, and the body starts in the author's native language.
- Merge with squash, and let the squashed subject be the PR title with `(#N)` appended.
- Destructive or outward-facing operations — `gh pr merge`, branch deletion, `git push` — require explicit confirmation each time. Never run them unprompted.

## Commands

- Create a PR: `gh pr create --title "<conventional subject>" --body-file <path>` — write the multilingual body to a file and pass it with `--body-file` to preserve formatting. Without `--body`, `gh` pre-fills [`.github/pull_request_template.md`](../.github/pull_request_template.md).
- Inspect a PR: `gh pr view <n>` (add `--web` to open in a browser).
- Squash merge: `gh pr merge <n> --squash --delete-branch` — **destructive and outward-facing; confirm before running.**

## Reference

- [CONTRIBUTING.md](../CONTRIBUTING.md) — branch naming, merge policy, and the project laws PRs enforce.
- [docs/tdd.md](tdd.md) — the TDD cycle to follow when a PR contains production code.
- [docs/commit.md](commit.md) — the Conventional Commits rules for commit and PR-title subjects.
