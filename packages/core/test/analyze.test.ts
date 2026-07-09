import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { analyzeProject } from "../src/index";
import type { Catalog, ComponentDoc } from "../src/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(__dirname, "fixtures", "button-app");

describe("analyzeProject (button-app fixture)", () => {
  let catalog: Catalog;
  let button: ComponentDoc;

  it("runs without throwing and returns one component", async () => {
    catalog = await analyzeProject({ root: fixtureRoot });
    expect(catalog.schemaVersion).toBe(0);
    expect(catalog.generator).toBe("@thmh/core@0.0.0");
    expect(typeof catalog.generatedAt).toBe("string");
    expect(() => new Date(catalog.generatedAt).toISOString()).not.toThrow();
    expect(catalog.components).toHaveLength(1);

    const found = catalog.components[0];
    if (!found) throw new Error("expected a component");
    button = found;
  });

  it("has the correct identity", () => {
    expect(button.name).toBe("Button");
    expect(button.filePath).toBe("src/components/ui/button.tsx");
    expect(button.id).toBe("src/components/ui/button.tsx#Button");
    expect(button.description).toBe(
      "A button. Supports visual variants and sizes via cva.",
    );
  });

  it("extracts the declared fullWidth prop with its JSDoc default", () => {
    const fullWidth = button.props.find((prop) => prop.name === "fullWidth");
    expect(fullWidth).toBeDefined();
    expect(fullWidth?.type).toBe("boolean");
    expect(fullWidth?.required).toBe(false);
    expect(fullWidth?.defaultValue).toBe("false");
    expect(fullWidth?.description).toBe(
      "Stretch the button to fill its container.",
    );
    expect(fullWidth?.source).toBe("declared");
  });

  it("drops HTML attributes that only live in node_modules", () => {
    expect(
      button.props.find((prop) => prop.name === "onClick"),
    ).toBeUndefined();
    expect(
      button.props.find((prop) => prop.name === "aria-label"),
    ).toBeUndefined();
  });

  it("captures the cva doc with defaultVariants", () => {
    expect(button.cva).toBeDefined();
    expect(button.cva?.exportName).toBe("buttonVariants");
    expect(button.cva?.defaultVariants).toEqual({
      variant: "default",
      size: "default",
    });
  });

  it("exposes exactly the 5 variant options and 3 size options", () => {
    expect(Object.keys(button.cva?.variants.variant ?? {})).toEqual([
      "default",
      "secondary",
      "destructive",
      "outline",
      "ghost",
    ]);
    expect(Object.keys(button.cva?.variants.size ?? {})).toEqual([
      "sm",
      "default",
      "lg",
    ]);
  });

  it("synthesizes variant and size props from the cva doc", () => {
    const variant = button.props.find((prop) => prop.name === "variant");
    expect(variant).toBeDefined();
    expect(variant?.source).toBe("cva");
    expect(variant?.required).toBe(false);
    expect(variant?.defaultValue).toBe('"default"');
    expect(variant?.type).toBe(
      '"default" | "secondary" | "destructive" | "outline" | "ghost"',
    );

    const size = button.props.find((prop) => prop.name === "size");
    expect(size).toBeDefined();
    expect(size?.source).toBe("cva");
    expect(size?.defaultValue).toBe('"default"');
    expect(size?.type).toBe('"sm" | "default" | "lg"');
  });

  it("collects no warnings for the well-formed fixture", () => {
    expect(catalog.warnings).toEqual([]);
  });
});
