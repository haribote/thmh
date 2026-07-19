# ui

The human-facing catalog: pages, layouts, and components. Feature IDs in this domain are split by kind:

- `UIC` — components
- `UIL` — layouts
- `UIP` — pages
- `UIX` — other (features that do not appear directly on screen, e.g. the catalog BFF connection)

| ID | Title | Summary |
| --- | --- | --- |
| [UIP001](UIP001_catalog-page.md) | Catalog page | The single page at `/__thmh/`, built in the browser from the catalog. |
| [UIC001](UIC001_props-table.md) | Props table | What a component accepts: name, type, required, default, description. |
| [UIC002](UIC002_variant-matrix-grid.md) | Variant matrix grid | Two variant axes as a grid of previews, with the rest pinned. |
| [UIX001](UIX001_preview-sandbox.md) | Preview sandbox | One component rendered in an isolated frame, addressed entirely by URL. |
| [UIX002](UIX002_live-reload.md) | Live reload | An SSE notification that the manifest changed, answered by a reload. |

See [requirements](../requirements.md) and [CONTRIBUTING.md](../../CONTRIBUTING.md).
