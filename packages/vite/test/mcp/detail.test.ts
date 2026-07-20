import type { Catalog, ComponentDoc } from "@thmh/core";
import { describe, expect, it } from "vitest";
import { detail } from "../../src/mcp/detail";

function component(overrides: Partial<ComponentDoc> = {}): ComponentDoc {
  return {
    id: "src/Button.tsx#Button",
    name: "Button",
    filePath: "src/Button.tsx",
    props: [],
    ...overrides,
  };
}

function catalog(...components: ComponentDoc[]): Catalog {
  return {
    schemaVersion: 0,
    generator: "test",
    generatedAt: "2026-07-20T00:00:00.000Z",
    components,
    warnings: [],
  };
}

describe("detail", () => {
  it("returns the record whose id matches", () => {
    const found = detail(catalog(component()), "src/Button.tsx#Button");

    expect(found?.component.name).toBe("Button");
  });

  it("does not match an id that differs in case", () => {
    const found = detail(catalog(component()), "src/button.tsx#button");

    expect(found).toBeUndefined();
  });

  it("does not trim the id", () => {
    const found = detail(catalog(component()), " src/Button.tsx#Button ");

    expect(found).toBeUndefined();
  });

  it("carries the catalog's warnings", () => {
    const withWarning: Catalog = {
      ...catalog(component()),
      warnings: ["cva skipped in a.tsx"],
    };

    const found = detail(withWarning, "src/Button.tsx#Button");

    expect(found?.warnings).toEqual(["cva skipped in a.tsx"]);
  });

  it("returns the record as the manifest holds it", () => {
    const record = component({
      description: "A button.",
      props: [
        {
          name: "variant",
          type: '"default" | "ghost"',
          required: false,
          defaultValue: '"default"',
          source: "cva",
        },
      ],
      cva: {
        exportName: "buttonVariants",
        base: "inline-flex",
        variants: { variant: { default: "bg-slate-900", ghost: "bg-none" } },
        defaultVariants: { variant: "default" },
      },
    });

    const found = detail(catalog(record), record.id);

    expect(found?.component).toEqual(record);
  });
});
