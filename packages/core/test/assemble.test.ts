import { Project } from "ts-morph";
import { describe, expect, it } from "vitest";
import { assembleComponents } from "../src/assemble";

function createProject(): Project {
  return new Project({ useInMemoryFileSystem: true });
}

describe("assembleComponents (per-component isolation)", () => {
  it("skips a component whose call signature parameter lacks a value declaration, without discarding other components in the same file", () => {
    const project = createProject();
    const sourceFile = project.createSourceFile(
      "union.tsx",
      `
      import { cva } from "class-variance-authority";

      const buttonVariants = cva("base", { variants: {} });

      export interface AProps {
        label: string;
      }
      export interface BProps {
        count: number;
      }

      type UnionComponent =
        | ((props: AProps) => null)
        | ((props: BProps) => null);

      export const UnionButton: UnionComponent = ((props: unknown) =>
        null) as UnionComponent;

      export function PlainButton(props: AProps) {
        return null;
      }
      `,
    );

    const { components, warnings } = assembleComponents(sourceFile, "/");

    expect(components).toHaveLength(1);
    expect(components[0]?.name).toBe("PlainButton");
    expect(warnings.some((warning) => warning.includes("#UnionButton"))).toBe(
      true,
    );
  });
});
