import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generatePreviewEntryCode } from "../src/preview";

const STATIC_IMPORT = /^import\s.*\sfrom\s"([^"]+)";$/gm;

function toPackageName(specifier: string): string {
  const segments = specifier.split("/");
  const scoped = specifier.startsWith("@");
  return segments.slice(0, scoped ? 2 : 1).join("/");
}

function packagesImportedBy(code: string): string[] {
  const specifiers = [...code.matchAll(STATIC_IMPORT)]
    .map((match) => match[1])
    .filter((specifier) => specifier !== undefined);
  const bare = specifiers.filter(
    (specifier) => !specifier.startsWith(".") && !specifier.startsWith("/"),
  );
  return [...new Set(bare.map(toPackageName))].sort();
}

describe("generatePreviewEntryCode", () => {
  it("imports react and react-dom/client, which the host has to supply", () => {
    const code = generatePreviewEntryCode("/src/index.css");

    expect(code).toContain('import React from "react";');
    expect(code).toContain('import { createRoot } from "react-dom/client";');
  });

  it("imports nothing the package does not declare as a peer dependency", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
    ) as { peerDependencies?: Record<string, string> };
    const declared = Object.keys(manifest.peerDependencies ?? {});
    const imported = packagesImportedBy(
      generatePreviewEntryCode("/src/index.css"),
    );

    expect(imported).not.toHaveLength(0);
    expect(declared).toEqual(expect.arrayContaining(imported));
  });
});
