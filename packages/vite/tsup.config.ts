import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "client/ui": "src/client/ui.ts",
  },
  format: ["esm"],
  dts: {
    entry: { index: "src/index.ts" },
  },
  clean: true,
});
