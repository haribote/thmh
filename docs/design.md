# Writing a design document

No feature is implemented without a design ([CONTRIBUTING.md](../CONTRIBUTING.md)). This guide is the procedure for satisfying that law: when a design document is required, how to create one, and how to tell when it is finished.

## When a design is needed

Two separate questions. Answer both.

**Does this need a new document?** Yes when the work introduces a new feature ID. If what you are building fits under an existing ID, it does not — update that document instead.

**Does it need an existing document updated?** Yes when, after the change, what a design document says no longer matches the code.

| Change | New document | Update |
| --- | --- | --- |
| Add `search_components` to the MCP server | Yes — `MCP002` | — |
| Teach the cva adapter to read template literals | No | `ANA003`, whose Design section states which literal forms are supported |
| Replace the cva-to-component association | No | `ANA005`, whose Design section describes the current mechanism |
| Rename or move a module a document cites by path | No | Whichever documents cite it |
| Bump a dependency, change CI, fix a typo | No | No |

Observable behavior changes always require an update. An internal replacement requires one only when a Design section describes that internal — which it usually does, since that section is where "how it works" lives.

Neither question is answered by the size of the diff. A one-line change that alters the manifest contract needs `MAN001` updated; a large refactor that no document describes needs nothing.

## Choosing the domain and the feature ID

Pick the domain by the capability, not by the package the code will live in. A feature spanning `@thmh/core` and `@thmh/vite` still belongs to one domain.

- `analysis` (`ANA`) — component discovery, and prop, variant, and token extraction.
- `manifest` (`MAN`) — the `catalog.json` contract: schema, generation, versioning.
- `mcp` (`MCP`) — the agent-facing server and its tools.
- `cli` (`CLI`) — the `thmh` command.
- `integration` (`INT`) — the host environment and external ecosystems.
- `ui` — the human-facing catalog, split by kind: `UIC` component, `UIL` layout, `UIP` page, `UIX` off-screen.

Then take the next free `NNN` for that CODE. Sequences are numbered independently per CODE, so `ANA006` and `MCP006` are unrelated. Read the domain's `index.md` to find the highest number in use; numbers are never reused, even if a document is deleted.

The full scheme, including the filename format, is in [CONTRIBUTING.md](../CONTRIBUTING.md).

## Filling the template

Copy the domain's `_template.md` to `{ID}_{kebab-slug}.md`. Do not hand-roll the file — the template carries the front matter and the section order that the indexes and cross-references depend on.

Fill the front matter first: `id`, `title`, and the two dependency fields. Leave `layer` and `status` out unless they say something a reader needs.

The five non-UI domains share four sections:

- **Overview** — what the feature is, in one or two sentences. A reader who stops here should know whether this document is the one they want.
- **Requirements** — which requirement this satisfies (see below).
- **Design** — how it works. The contract, the mechanism, and the constraints that shaped it.
- **Notes** — edge cases, open questions, and alternatives considered. Rejected alternatives belong here with the reason; otherwise the next contributor reopens the same question. A shortfall the project has decided to live with closes by saying so, so a reader can tell a settled decision from an open one.

`ui` adds **Anatomy** (structure and parts), **Behavior** (interactions and states), and **A11y** (keyboard focus, semantics, contrast), and narrows **Design** to visual and information hierarchy.

**Diagrams belong in Design, when they carry what prose cannot.** Write one as a fenced `mermaid` block, which GitHub renders in place. A diagram earns its space when the shape is the point and holding it in prose costs the reader real effort: a pipeline of several stages, a decision that falls through in order, an exchange between processes. It does not earn its space by redrawing a list or a table.

The analysis domain shows where the line falls. Only the document describing how the stages combine carries diagrams — one for the pipeline, one for the rule that decides which variant definition belongs to which component. The four documents that each describe a single stage say what they need in a sentence, and a diagram there would restate it rather than add to it.

**A ui document may show layout as a text wireframe**, in a plain fenced block, under Anatomy. The same test applies: it earns its space when the arrangement is the point, and not when it redraws a list of parts. Of the five ui documents, two have one — the page and the variant grid — because in both the arrangement carries a decision that prose states poorly.

Draw the intent, not the pixels. A wireframe here says which things sit where and what comes before what; it is not a copy of the rendered screen, and it should not acquire colors, spacing, or type. Screenshots are deliberately not used: an image of the running catalog is a hand-maintained duplicate of something the code already determines, and it goes stale silently, which is the failure this project exists to remove. To see the real thing, run the dev server.

Writing a design for something already implemented follows the same procedure. Describe what the code does now, and put what it should do instead in Notes.

## Linking to the requirement

Every design document names the requirement it satisfies, and the link runs both ways.

In the document's Requirements section, link to the section of [requirements.md](requirements.md) that holds the requirement, and quote the bullet.

In `requirements.md`, append the feature ID to that bullet:

```markdown
- Expose an MCP server co-located with the dev server _(Beta)_ — MCP001
- `add_variant`: append a variant override to a `defineCatalog` file _(GA)_
```

A bullet with no feature ID is a requirement nobody has designed yet. That is the reverse lookup the ID gives you, and it is why the write-back is not optional.

If no bullet in `requirements.md` covers what you are about to design, stop and add one. `requirements.md` holds What and Why; a feature with no requirement behind it is a feature nobody asked for.

## Wiring the dependency graph

`depends_on` and `used_by` are the two directions of one edge. Write both.

```yaml
# docs/mcp/MCP002_search-components.md
depends_on: [MAN001]
```

```yaml
# docs/manifest/MAN001_catalog-schema.md
used_by: [MCP002]
```

Adding a document therefore means editing the documents it points at. Values are feature IDs, never filenames.

## Updating the indexes

In the same pull request, add a row to the domain's `index.md` table, and confirm the document is reachable from [docs/index.md](index.md). Both indexes are maintained by hand, so a document that is not listed is a document nobody finds.

## Definition of done

**A design is finished when you can write its test list from it without inventing behavior.**

[docs/tdd.md](tdd.md) opens by requiring a test list, built and agreed with the user before any code is written. If producing that list means deciding things the document left open, the design is not done. Those decisions still get made — but they get made there, after the design review has closed, in a conversation that leaves no reviewed artifact behind.

Apply the test to each claim:

| Design says | Test list |
| --- | --- |
| "Registering an unknown adapter name fails, and the error names the registered adapters." | `rejects an unknown adapter name, naming the registered ones` |
| "When two adapters claim the same file, the later registration wins." | `prefers the later registration when two adapters claim one file` |
| "Errors are handled appropriately." | Nothing can be derived. Not done. |

This is the question to ask in review, not a section to write. The test list is built at implementation time, per `docs/tdd.md`, and the tests themselves are its record. Keeping a copy in the design document would be one more hand-maintained duplicate of a truth that lives in the code.

A design document is reviewed and merged before implementation starts.
