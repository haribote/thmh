# integration

How thmh meets the world outside its own packages, in two directions. Inward: the host environment it runs in — the Vite plugin, the TypeScript toolchain it analyzes through, and the detection of cva and Tailwind in a consumer project. Outward: other ecosystems — the shadcn registry, prebuilt manifests, remote publishing, and the npm manifest convention. Feature IDs in this domain use the `INT` prefix.

| ID | Title | Summary |
| --- | --- | --- |
| [INT001](INT001_vite-plugin.md) | Vite plugin | thmh attached to the host app's dev server, inheriting its config. |
| [INT002](INT002_typescript-project-resolution.md) | TypeScript project resolution | The compiler options and the file set that analysis reads through. |

See [requirements](../requirements.md) and [CONTRIBUTING.md](../../CONTRIBUTING.md).
