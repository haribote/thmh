---
name: thmh-design
description: "Use when writing or updating a feature design document in this repo — the design-first law that no feature is implemented without a design at docs/<domain>/{ID}_slug.md. Follow this whenever you are about to design a feature, assign a feature ID, copy a domain _template.md, or the user mentions 設計, 設計ドキュメント, design doc, feature ID, or design-first, even if they do not name the convention. Also follow it before implementing anything that has no design yet. Follows docs/design.md."
---

Follow `docs/design.md` — the canonical, agent-agnostic procedure for writing a feature design document. It is the single source of truth; this skill is a thin adapter that points to it.

Read that document and follow it: decide whether a new document or an update to an existing one is required, pick the domain and feature ID, copy the domain's `_template.md`, link the requirement in both directions, wire `depends_on` / `used_by`, and update the indexes.

A design is finished when its test list can be written from it without inventing behavior. A design document is reviewed and merged before implementation starts.
