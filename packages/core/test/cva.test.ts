import { Project } from "ts-morph";
import { describe, expect, it } from "vitest";
import { extractCvaCalls } from "../src/adapters/cva";
import { assembleComponents } from "../src/assemble";

function createProject(): Project {
  return new Project({ useInMemoryFileSystem: true });
}

describe("extractCvaCalls", () => {
  it("resolves an aliased cva import", () => {
    const project = createProject();
    const sourceFile = project.createSourceFile(
      "aliased.ts",
      `
      import { cva as makeVariants } from "class-variance-authority";
      export const badge = makeVariants("badge-base", {
        variants: { tone: { info: "tone-info", danger: "tone-danger" } },
      });
      `,
    );

    const { calls, warnings } = extractCvaCalls(sourceFile);

    expect(warnings).toEqual([]);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.localName).toBe("badge");
    expect(calls[0]?.exportName).toBe("badge");
    expect(calls[0]?.doc.base).toBe("badge-base");
    expect(calls[0]?.doc.variants).toEqual({
      tone: { info: "tone-info", danger: "tone-danger" },
    });
  });

  it("joins an array-literal base with spaces", () => {
    const project = createProject();
    const sourceFile = project.createSourceFile(
      "array-base.ts",
      `
      import { cva } from "class-variance-authority";
      const chip = cva(["chip-base", "chip-rounded"], { variants: {} });
      `,
    );

    const { calls, warnings } = extractCvaCalls(sourceFile);

    expect(warnings).toEqual([]);
    expect(calls[0]?.doc.base).toBe("chip-base chip-rounded");
  });

  it("normalizes boolean variant keys", () => {
    const project = createProject();
    const sourceFile = project.createSourceFile(
      "boolean-keys.ts",
      `
      import { cva } from "class-variance-authority";
      const toggle = cva("toggle-base", {
        variants: { disabled: { true: "toggle-disabled", false: "" } },
      });
      `,
    );

    const { calls, warnings } = extractCvaCalls(sourceFile);

    expect(warnings).toEqual([]);
    expect(calls[0]?.doc.variants).toEqual({
      disabled: { true: "toggle-disabled", false: "" },
    });
  });

  it("supports quoted property keys", () => {
    const project = createProject();
    const sourceFile = project.createSourceFile(
      "quoted-keys.ts",
      `
      import { cva } from "class-variance-authority";
      const tag = cva("tag-base", {
        variants: { "tone": { "info": "tone-info" } },
      });
      `,
    );

    const { calls, warnings } = extractCvaCalls(sourceFile);

    expect(warnings).toEqual([]);
    expect(calls[0]?.doc.variants).toEqual({ tone: { info: "tone-info" } });
  });

  it("extracts compoundVariants, mapping class/className to className", () => {
    const project = createProject();
    const sourceFile = project.createSourceFile(
      "compound.ts",
      `
      import { cva } from "class-variance-authority";
      const alert = cva("alert-base", {
        variants: {
          tone: { info: "tone-info", danger: "tone-danger" },
          size: { sm: "size-sm", lg: "size-lg" },
        },
        compoundVariants: [
          { tone: "danger", size: "lg", class: "alert-danger-lg" },
          { tone: "info", className: "alert-info" },
        ],
      });
      `,
    );

    const { calls, warnings } = extractCvaCalls(sourceFile);

    expect(warnings).toEqual([]);
    expect(calls[0]?.doc.compoundVariants).toEqual([
      {
        conditions: { tone: "danger", size: "lg" },
        className: "alert-danger-lg",
      },
      { conditions: { tone: "info" }, className: "alert-info" },
    ]);
  });

  it("skips unsupported nodes but collects a warning, without dropping the whole cva", () => {
    const project = createProject();
    const sourceFile = project.createSourceFile(
      "unsupported.ts",
      `
      import { cva } from "class-variance-authority";
      const dynamicClass = "computed";
      const widget = cva("widget-base", {
        variants: {
          tone: { info: "tone-info", broken: dynamicClass },
          size: { sm: "size-sm" },
        },
      });
      `,
    );

    const { calls, warnings } = extractCvaCalls(sourceFile);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.doc.variants).toEqual({
      tone: { info: "tone-info" },
      size: { sm: "size-sm" },
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("unsupported node in cva variants");
  });

  it("ignores a cva import from another package", () => {
    const project = createProject();
    const sourceFile = project.createSourceFile(
      "other-package.ts",
      `
      import { cva } from "some-other-lib";
      const notCva = cva("nope", { variants: {} });
      `,
    );

    const { calls, warnings } = extractCvaCalls(sourceFile);

    expect(calls).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it("associates a component to the matching cva only via a typeof reference, not a single-cva fallback", () => {
    const project = createProject();
    const sourceFile = project.createSourceFile(
      "two-cva.ts",
      `
      import { cva } from "class-variance-authority";

      export const alphaVariants = cva("alpha-base", {
        variants: { size: { sm: "a-sm", lg: "a-lg" } },
      });
      export const betaVariants = cva("beta-base", {
        variants: { size: { sm: "b-sm", lg: "b-lg" } },
      });

      export interface CardProps {
        tone: typeof betaVariants;
      }

      export function Card(props: CardProps) {
        return null;
      }
      `,
    );

    const { components } = assembleComponents(sourceFile, "/");

    expect(components).toHaveLength(1);
    expect(components[0]?.cva?.base).toBe("beta-base");
  });

  it("leaves cva undefined when two cva calls exist and none match by typeof", () => {
    const project = createProject();
    const sourceFile = project.createSourceFile(
      "two-cva-no-match.ts",
      `
      import { cva } from "class-variance-authority";

      export const alphaVariants = cva("alpha-base", { variants: {} });
      export const betaVariants = cva("beta-base", { variants: {} });

      export function Card(props: { size: string }) {
        return null;
      }
      `,
    );

    const { components } = assembleComponents(sourceFile, "/");

    expect(components).toHaveLength(1);
    expect(components[0]?.cva).toBeUndefined();
  });
});
