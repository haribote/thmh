# Filing an issue

Issues in this repo are multilingual: each is written starting in the author's native language, and always includes **both Japanese and English**. The familiar `English follows Japanese.` header is the common case — a Japanese-native author writing Japanese, then English. This document is the procedure to follow so every issue stays consistent and machine-followable. Policy — who may file, how issues relate to design documents — lives in [CONTRIBUTING.md](../CONTRIBUTING.md); this is only the how-to.

## The procedure

1. **Frame the background.**
   - Capture the problem or need and the context around it: why it matters now, where the gap is, and the intended outcome.
   - State the need, not the solution. Do not smuggle an implementation plan into the background.

2. **Break the work into tasks.**
   - Write a checklist of `- [ ]` items, each small enough that "done" is unambiguous and independently verifiable.
   - Keep the list scoped to what this issue is about. Do not fold in adjacent work.

3. **Write it in the required languages.**
   - Every issue includes **both Japanese and English** — these are required.
   - Start with the author's native language, then add the remaining required languages in the order Japanese, then English:
     - Native Japanese → `## 背景` / `## タスク`, then the English mirror (the `English follows Japanese.` case).
     - Native English → the English sections first, then the Japanese mirror.
     - Native other → the native-language sections first, then Japanese, then English.
   - Separate each language block with a `---` rule, and open with a line stating the reading order (e.g. `English follows Japanese.`).
   - Every language version mirrors one-to-one — same sections, same task items, same order.

4. **File it.**
   - Assemble the body from the template below and create the issue with `gh`.
   - Because the body is multi-line and contains a `---` rule, pass it from a file (`--body-file`), not inline.

## Template

The skeleton lives in [`.github/ISSUE_TEMPLATE/issue.md`](../.github/ISSUE_TEMPLATE/issue.md) — the single source of truth, so GitHub pre-fills it when you open an issue in the web UI or via `gh issue create`. It carries the `## 背景` / `## タスク` sections and their English mirror.

The template shows the Japanese-native case. Reorder the blocks by the rule above: an English-native author leads with the English block, and any other native language leads before Japanese and English.

## Non-negotiable rules

- **Japanese and English are both required, and every version mirrors exactly.** No section, sentence, or task item may appear in one language and not the others. Start with the author's native language; if it is neither Japanese nor English, its version leads and Japanese and English follow.
- **Tasks are verifiable checklist items.** Phrase each `- [ ]` so that whether it is done can be confirmed.
- **The background states the need, not the implementation.** Describe the problem and the desired outcome; leave the How to the design document.
- **Do not invent scope.** Keep background and tasks to what the issue is actually about.

## Commands

- Open an issue interactively (the web UI and `gh issue create` pre-fill the template): `gh issue create`.
- Create an issue from an assembled body file: `gh issue create --title "<title>" --body-file <path>`.
- View a filed issue: `gh issue view <n>`.

## Reference

See [CONTRIBUTING.md](../CONTRIBUTING.md) for who may file issues and how issues relate to the design-before-implementation rule.
