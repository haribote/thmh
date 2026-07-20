---
id: MCP002
title: search_components
depends_on: [MCP001, MAN001]
used_by: []
layer: feature
status: draft
---

# search_components

## Overview

The tool an agent calls to find out which components exist and which of them might be the one it wants. It answers with summaries rather than whole records, because choosing what to look at and looking at it are two steps, and the second is `get_component_detail`.

## Requirements

Satisfies, from [mcp](../requirements.md#mcp):

> `search_components`: return components matching a query, searching more of a component than its name. _(Beta)_

The neighbouring requirement, matching by what a component is *for*, is GA and is not designed here; see Notes.

## Design

**The input is `query`, a string, and `limit`, an optional integer of at least 1.** Both are declared in the tool's input schema, so a `limit` that is fractional or below 1 is refused by the SDK before this tool runs. A `limit` that is absent is not refused; it defaults to 20.

**Repeated terms are reduced to one.** `destructive destructive` searches for `destructive` once, and reports one match for it.

**An empty query is not an error; it returns everything, up to the limit.** An agent that has just connected has no name to search for, and asking for nothing is how it finds out what there is.

### What a query matches

The query is split on whitespace into terms. Each term is compared case-insensitively against four fields of every component, and matches a field when that field contains it as a substring.

| Rank | `field` | Where it comes from | Example |
| --- | --- | --- | --- |
| 0 | `name` | `name` | `Button` |
| 1 | `description` | `description`, absent on many components | the JSDoc summary |
| 2 | `propName` | every entry of `props`, including the ones synthesized from cva axes | `fullWidth`, `variant`, `size` |
| 3 | `variantOption` | the keys inside each axis of `cva.variants` | `destructive`, `ghost`, `sm` |

The `field` column is the value that appears in a result; there are four and no others.

A cva axis therefore appears twice over: its name is a prop, at rank 2, and its options are at rank 3. That is not a special case here — [MAN001](../manifest/MAN001_catalog-schema.md) records an axis as a synthesized prop, and this tool reads the manifest as it is.

**A component matches when every term matches at least one of its fields.** A term that matches nothing rules the component out, so adding a word narrows the result. Search that widened as the query grew would make a second word useless for telling two candidates apart, which is what a second word is for.

### What comes back

The answer is JSON, in the tool's single text content block:

```json
{
  "matched": 1,
  "total": 2,
  "results": [
    {
      "id": "src/components/ui/button.tsx#Button",
      "name": "Button",
      "description": "A button. Supports visual variants and sizes via cva.",
      "matches": [
        { "term": "button", "field": "name" },
        { "term": "button", "field": "description" },
        { "term": "destructive", "field": "variantOption" }
      ]
    }
  ],
  "warnings": []
}
```

**`matched` and `total` are both always present** — how many components the query matched, and how many the catalog holds. Together they distinguish a query that found nothing from a project that has nothing, and they show what a `limit` cut off without the agent having to infer it.

**`description` is omitted when the component has none**, rather than being null or empty. Many components have none.

**`matches` carries one entry per term and field that term landed on.** The example shows this: `button` is in the name *and* in the description, so it appears twice.

**`matches` is ordered by rank, and terms that tie on rank keep the order they had in the query.** That puts the strongest evidence first without hiding which term produced it.

**`warnings` is the catalog's own `warnings`**, passed through as [MCP001](MCP001_mcp-server.md) requires. A catalog that arrived carrying them is answered normally; the result is not marked an error.

**A source that rejects produces a different answer entirely**: a result marked as an error, whose single text block names the source and what failed, and which carries no JSON body. There is no `matched` or `total` to report, because nothing was read. MCP001 fixes that a rejection is reported this way; what the block says is settled here.

### Order

**Results are ordered by the worst field any term had to reach.** For each term, take the best rank among the fields it matched; a component's rank is the highest of those. Lower wins.

Searching `destructive button`, `Button` ranks 3: `button` reached rank 0, `destructive` only rank 3. A component named `DestructiveButton` would rank 0, because both terms are in its name, and would come first. The rule answers "how far from the name did we have to look", which is what makes a component named for the query beat one that merely has a variant by that name.

**Ties are broken by `id`**, ascending. Catalog order would have been the obvious choice and is the wrong one: MAN003 concatenates in whatever order the project reports its files and promises nothing about that order holding between runs, so ties would fall out differently for reasons no caller can see. Sorting by `id` is stable because ids are unique and derived from the file path and the export name. The comparison is by code point rather than by locale, so it does not vary with where the command runs.

An empty query has no terms and so no ranks; every component ties, and the whole answer comes back in `id` order.

**The limit is applied after ordering**, so what a caller receives is the best of what matched rather than the first the catalog happened to list.

### What it reads

The catalog comes from the source MCP001 supplies, whose `load` is called for each invocation, and failure follows the two shapes MCP001 sets out.

## Notes

**Searching four fields is not searching by intent, and the requirements now say so separately.** This finds `Button` for `destructive button`, though neither the phrase nor `destructive` is in its name. It does not find it for `clickable`, because no field in the catalog contains that word, and crossing more fields never supplies a notion of what a component is *for* rather than what it is *called*.

That gap used to sit inside one requirement bullet, which made this tool look like it satisfied something it does not. The bullet is now two: what this delivers, at Beta, and matching by purpose, at GA with no design behind it. Closing the second needs the manifest to carry something it does not, and that is a question for whatever designs it.

**Substring matching finds parts of words**, so `on` matches `button`. Terms are substrings rather than whole words because prop and variant names are frequently fragments — `sm`, `lg`, `fullWidth` — and whole-word matching would lose them. Short terms therefore match more than intended; the ranking pushes those results down without removing them. This is accepted for beta: the alternative costs the fragments, which are what an agent searching for a size actually types.

**A typo finds nothing.** `buton` matches no field. Edit-distance comparison would fix it and is not here, because it is worth knowing first whether agents mistype at all — they compose queries rather than typing them, and the failure this tool is likelier to meet is the synonym above.

**A component with neither a description nor variants is findable only by its name and prop names.** `App` in the example project is one. That is a property of what the analyzer found, not of this tool: descriptions come from JSDoc, and a component whose author wrote none has none to search.

**The default limit of 20 is a judgement, not a measurement.** It is larger than the result sets most projects can produce and small enough to keep a response readable. Nothing has observed what an agent does with a longer list. It is accepted at this value for beta, and `matched` tells a caller when raising it would show more.
