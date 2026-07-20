---
id: MCP003
title: get_component_detail
depends_on: [MCP001, MCP002, MAN001, MAN003]
used_by: []
layer: feature
status: draft
---

# get_component_detail

## Overview

The tool an agent calls once it knows which component it wants. It answers with that component's record from the catalog, unchanged, which is everything the manifest knows about it.

## Requirements

Satisfies, from [mcp](../requirements.md#mcp):

> `get_component_detail`: return full metadata for one component. _(Beta)_

## Design

**The input is `id`, a required non-empty string, and nothing else.** It is declared in the tool's input schema, so a missing or empty `id` is refused by the SDK before this tool runs. It is the identifier [`search_components`](MCP002_search-components.md) returns, so the two tools compose without the agent inventing anything.

**Ids are compared whole and exactly**, including case. Nothing is trimmed and nothing is parsed out of them.

A name would be the friendlier input and is not offered. [MAN003](../manifest/MAN003_catalog-generation.md) says two components with the same name in different files are two records, so a name does not identify one component, and a tool resolving it would have to choose between erroring on the ambiguity and guessing. Searching is how an agent turns a name into an id, and searching is already a tool.

**The answer is JSON in a single text content block**, as in MCP002, holding the component's record exactly as the manifest keeps it alongside the catalog's warnings:

```json
{
  "component": {
    "id": "src/components/ui/button.tsx#Button",
    "name": "Button",
    "filePath": "src/components/ui/button.tsx",
    "description": "A button. Supports visual variants and sizes via cva.",
    "props": [
      { "name": "fullWidth", "type": "boolean", "required": false,
        "defaultValue": "false",
        "description": "Stretch the button to fill its container.",
        "source": "declared" },
      { "name": "variant",
        "type": "\"default\" | \"secondary\" | \"destructive\" | \"outline\" | \"ghost\"",
        "required": false, "defaultValue": "\"default\"", "source": "cva" },
      { "name": "size", "type": "\"sm\" | \"default\" | \"lg\"",
        "required": false, "defaultValue": "\"default\"", "source": "cva" }
    ],
    "cva": {
      "exportName": "buttonVariants",
      "base": "inline-flex items-center justify-center …",
      "variants": {
        "variant": { "default": "…", "secondary": "…", "destructive": "…",
                     "outline": "…", "ghost": "…" },
        "size": { "sm": "…", "default": "…", "lg": "…" }
      },
      "defaultVariants": { "variant": "default", "size": "default" }
    }
  },
  "warnings": []
}
```

The envelope has exactly two fields, `component` and `warnings`, and `component` is always one record. Every key the real record holds appears above; only the class strings are replaced by `…`, to keep the page readable. The tool replaces nothing.

**No field of the record is added, removed, or reshaped.** What the manifest gains later — token dependencies, whatever the Tailwind adapter adds — reaches an agent through this tool without anyone changing it.

### Why nothing is derived

**No axes are returned.** A cva axis usually reaches `props` as a prop whose type enumerates the axis's options, so `variant` arrives as `"default" | "secondary" | "destructive" | "outline" | "ghost"` with its default beside it. Returning the axes as well would put the same options in the answer twice, in two shapes, which is the duplication this project treats as a defect.

`props` and `cva` do not always agree, and where they part it is `cva` that keeps the option names — which this tool returns, so nothing is lost. [ANA005](../analysis/ANA005_manifest-assembly.md) parts them in two ways: an axis of exactly `true` and `false` becomes the type `boolean`, and an axis whose name a declared prop already uses contributes no prop at all, the author's own declaration winning. Stating the rule rather than the two cases is deliberate; a third way of parting them would not make this paragraph wrong.

**No combinations are returned.** An agent given the options can form whatever combination it means to write, so enumerating the product would answer a question nobody asked while growing the response with every axis.

**The `cva` block is passed through with its class strings.** They are of no use to an agent writing JSX, which passes props rather than classes, and they are what an agent editing the variant definition would need. Projecting them out would mean maintaining a second shape of the record to save response size alone.

### When there is no such component

**An unknown `id` is an error, not an empty answer.** The result is marked as an error and carries a single text block, with no JSON body. It quotes the id, says it is not in the catalog, and names `search_components` as the way to find one that is. An empty answer would read as a component with no props.

**Any warnings the catalog carried are included in that block.** MCP001 requires warnings to reach the agent, and a catalog that arrived damaged is exactly when an agent most needs to know why the id it was given is missing.

This is not a third member of MCP001's pair. Those two shapes are ways of failing to obtain a catalog; this one obtained a catalog and failed to satisfy the request from it.

What it does not say is that the catalog is sound. [MAN002](../manifest/MAN002_dev-manifest-refresh.md) turns a failed analysis into an empty catalog carrying the reason in `warnings`, so a perfectly good id can come back not-found because there was nothing to find it in. The warnings above are what an agent has to tell the two apart, and they are not yet enough: MAN001 records that a warning about one component and a warning that analysis collapsed are not distinguishable. Until that lands, this tool can report the warnings but cannot say which happened.

### What it reads

The catalog comes from the source [MCP001](MCP001_mcp-server.md) supplies, and both `load` being called per invocation and the two shapes a failure to obtain one takes are settled there. `warnings` is the catalog's own, passed through, and its presence does not mark the result an error.

## Notes

**`props` is neither everything the component accepts nor always complete in itself**, and this tool cannot improve on that, because it passes the record through. Three separate things narrow it, all recorded against [ANA002](../analysis/ANA002_react-props-adapter.md).

Members inherited from `node_modules` are dropped deliberately. `Button` extends `React.ButtonHTMLAttributes<HTMLButtonElement>` and its record lists three props, so `onClick`, `disabled`, and `type` are absent; listing every DOM attribute would bury the props an author wrote. The fix chosen for this is not to enumerate them but to record what the props type extends, so an answer names `React.ButtonHTMLAttributes<HTMLButtonElement>` and an agent knows where the rest live. That is a requirement under [analysis](../requirements.md#analysis) with no design behind it yet, and this tool carries the field unchanged once it exists.

Props written through a local mapped or utility type are dropped as well, and the extends field will not reach them: a prop that `Omit<…>` produced has no inherited type to name. ANA002 records both the cause and the more precise rule that would fix it.

A `declared` prop's type is truncated past 200 characters, so a prop can be listed with a type that is not the whole type. `cva` props are unaffected, being synthesized rather than printed.

**An id is opaque, and looks like it is not.** It reads as `path#ExportName`, so an agent may construct one rather than take it from a search. That will usually work and is not promised: MAN001 owns the format, and this tool compares whole ids. A constructed id that is wrong produces the not-found error, which is the intended outcome.

**Nothing tells an agent how to import the component.** `filePath` is where it lives, relative to the analyzed root, which is not always what an import specifier looks like — an alias or a package export can differ. Deriving the specifier is left to the agent, which has the project's configuration and this tool does not. Accepted for beta: resolving it here would mean reimplementing the host's module resolution against a config this tool never sees.

**`cartesianProduct` still has no production caller.** [ANA004](../analysis/ANA004_variant-matrix.md) records that as debt and this tool was the obvious place to end it. It does not, because an agent does not need the product, and calling a function to produce something nobody asked for would answer the debt by inventing a requirement. ANA004 puts the decision about where the matrix belongs with MAN001 and UIC002, and it is not this tool's to pre-empt.
