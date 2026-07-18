---
name: thmh-pr
description: "Use when handling a pull request in this repo — creating a branch, writing the PR body, review, squash-merge, or post-merge branch cleanup. Follow this whenever you open or draft a PR, or the user mentions PR を出す, プルリク, squash merge, or branch 削除, even if they do not say 'pull request' explicitly. Follows docs/pr.md."
---

Follow `docs/pr.md` — the canonical, agent-agnostic procedure for handling a pull request from branch through post-merge. It is the single source of truth; this skill is a thin adapter that points to it.

The PR body template lives in `.github/pull_request_template.md`. Read the document and follow its lifecycle, template, and non-negotiable rules — including that destructive or outward-facing operations (`gh pr merge`, branch deletion, `git push`) require explicit confirmation each time.
