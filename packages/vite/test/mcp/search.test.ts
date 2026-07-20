import type { Catalog, ComponentDoc } from "@thmh/core";
import { describe, expect, it } from "vitest";
import { search } from "../../src/mcp/search";

function component(overrides: Partial<ComponentDoc>): ComponentDoc {
  return {
    id: `src/${overrides.name ?? "X"}.tsx#${overrides.name ?? "X"}`,
    name: "X",
    filePath: "src/X.tsx",
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

describe("search", () => {
  it("matches a term against the name", () => {
    const result = search(catalog(component({ name: "Button" })), "button");

    expect(result.matched).toBe(1);
    expect(result.results[0]).toMatchObject({
      name: "Button",
      matches: [{ term: "button", field: "name" }],
    });
  });

  it("matches case-insensitively", () => {
    const found = search(catalog(component({ name: "Button" })), "BUTTON");

    expect(found.matched).toBe(1);
  });

  it("matches a term as a substring", () => {
    const found = search(catalog(component({ name: "Button" })), "utto");

    expect(found.matched).toBe(1);
  });

  it("matches a term against the description", () => {
    const found = search(
      catalog(component({ name: "X", description: "A clickable thing." })),
      "clickable",
    );

    expect(found.results[0]?.matches).toEqual([
      { term: "clickable", field: "description" },
    ]);
  });

  it("matches a term against a prop name", () => {
    const found = search(
      catalog(
        component({
          name: "X",
          props: [
            {
              name: "fullWidth",
              type: "boolean",
              required: false,
              source: "declared",
            },
          ],
        }),
      ),
      "fullwidth",
    );

    expect(found.results[0]?.matches).toEqual([
      { term: "fullwidth", field: "propName" },
    ]);
  });

  it("matches a term against a variant option name", () => {
    const found = search(
      catalog(
        component({
          name: "X",
          cva: { variants: { variant: { destructive: "bg-red" } } },
        }),
      ),
      "destructive",
    );

    expect(found.results[0]?.matches).toEqual([
      { term: "destructive", field: "variantOption" },
    ]);
  });

  it("excludes a component when one term matches nothing", () => {
    const found = search(catalog(component({ name: "Button" })), "button gone");

    expect(found.matched).toBe(0);
  });

  it("reduces a repeated term to one", () => {
    const found = search(
      catalog(component({ name: "Button" })),
      "button button",
    );

    expect(found.results[0]?.matches).toEqual([
      { term: "button", field: "name" },
    ]);
  });

  it("returns everything for an empty query", () => {
    const found = search(
      catalog(component({ name: "A" }), component({ name: "B" })),
      "",
    );

    expect(found.matched).toBe(2);
  });

  it("reports how many matched and how many the catalog holds", () => {
    const found = search(
      catalog(component({ name: "Button" }), component({ name: "App" })),
      "button",
    );

    expect(found).toMatchObject({ matched: 1, total: 2 });
  });

  it("omits description when the component has none", () => {
    const found = search(catalog(component({ name: "Button" })), "button");

    expect(found.results[0]).not.toHaveProperty("description");
  });

  it("carries one match entry per term and field", () => {
    const found = search(
      catalog(component({ name: "Button", description: "A button." })),
      "button",
    );

    expect(found.results[0]?.matches).toEqual([
      { term: "button", field: "name" },
      { term: "button", field: "description" },
    ]);
  });

  it("orders matches by rank, then by the order terms had in the query", () => {
    const found = search(
      catalog(
        component({
          name: "Card",
          description: "A card.",
          cva: { variants: { tone: { flat: "x" } } },
        }),
      ),
      "flat card",
    );

    expect(found.results[0]?.matches).toEqual([
      { term: "card", field: "name" },
      { term: "card", field: "description" },
      { term: "flat", field: "variantOption" },
    ]);
  });

  it("passes the catalog's warnings through", () => {
    const withWarning: Catalog = {
      ...catalog(component({ name: "Button" })),
      warnings: ["a warning"],
    };

    expect(search(withWarning, "button").warnings).toEqual(["a warning"]);
  });

  it("ranks a component by the worst field any term had to reach", () => {
    const found = search(
      catalog(
        component({
          name: "Button",
          cva: { variants: { variant: { destructive: "x" } } },
        }),
        component({ name: "DestructiveButton" }),
      ),
      "destructive button",
    );

    expect(found.results.map((r) => r.name)).toEqual([
      "DestructiveButton",
      "Button",
    ]);
  });

  it("breaks ties by id, ascending", () => {
    const found = search(
      catalog(
        component({ id: "src/b.tsx#B", name: "Widget" }),
        component({ id: "src/a.tsx#A", name: "Widget" }),
      ),
      "widget",
    );

    expect(found.results.map((r) => r.id)).toEqual([
      "src/a.tsx#A",
      "src/b.tsx#B",
    ]);
  });

  it("returns id order for an empty query", () => {
    const found = search(
      catalog(
        component({ id: "src/z.tsx#Z", name: "Z" }),
        component({ id: "src/a.tsx#A", name: "A" }),
      ),
      "",
    );

    expect(found.results.map((r) => r.id)).toEqual([
      "src/a.tsx#A",
      "src/z.tsx#Z",
    ]);
  });

  it("applies the limit after ordering", () => {
    const found = search(
      catalog(
        component({
          id: "src/b.tsx#B",
          name: "Button",
          cva: { variants: { variant: { primary: "x" } } },
        }),
        component({ id: "src/a.tsx#A", name: "PrimaryButton" }),
      ),
      "primary button",
      1,
    );

    expect(found.matched).toBe(2);
    expect(found.results.map((r) => r.name)).toEqual(["PrimaryButton"]);
  });

  it("defaults the limit to twenty", () => {
    const many = Array.from({ length: 25 }, (_, i) =>
      component({ id: `src/${String(i).padStart(2, "0")}.tsx#C`, name: "C" }),
    );

    const found = search(catalog(...many), "c");

    expect(found.matched).toBe(25);
    expect(found.results).toHaveLength(20);
  });
});
