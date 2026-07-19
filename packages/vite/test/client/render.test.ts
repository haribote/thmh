// @vitest-environment happy-dom
import type { ComponentDoc, CvaDoc, PropDoc } from "@thmh/core";
import { describe, expect, it } from "vitest";
import {
  renderMatrix,
  renderPropsTable,
  renderSinglePreview,
} from "../../src/client/render";

const PROPS: PropDoc[] = [
  { name: "label", type: "string", required: true, source: "declared" },
];

const CVA: CvaDoc = {
  variants: {
    variant: { solid: "", ghost: "" },
    size: { sm: "", md: "", lg: "" },
    tone: { neutral: "", brand: "" },
  },
  defaultVariants: { tone: "neutral" },
};

const BUTTON: ComponentDoc = {
  id: "src/Button.tsx#Button",
  name: "Button",
  filePath: "src/Button.tsx",
  props: PROPS,
  cva: CVA,
};

function titlesOf(table: HTMLElement): string[] {
  return [...table.querySelectorAll("iframe")].map(
    (frame) => frame.getAttribute("title") ?? "",
  );
}

describe("the props table", () => {
  it("declares that its headers head columns", () => {
    const table = renderPropsTable(BUTTON.name, PROPS);

    const scopes = [...table.querySelectorAll("th")].map((th) =>
      th.getAttribute("scope"),
    );
    expect(scopes).toEqual(["col", "col", "col", "col", "col"]);
  });

  it("is named by the component whose props it lists", () => {
    const table = renderPropsTable(BUTTON.name, PROPS);

    expect(table.querySelector("caption")?.textContent).toContain("Button");
  });
});

describe("the variant matrix", () => {
  it("declares which direction each header heads", () => {
    const table = renderMatrix(BUTTON, CVA);

    const header = table.querySelector("tr");
    const headerScopes = [...(header?.querySelectorAll("th") ?? [])].map((th) =>
      th.getAttribute("scope"),
    );
    expect(headerScopes.every((scope) => scope === "col")).toBe(true);

    const bodyRows = [...table.querySelectorAll("tr")].slice(1);
    const rowScopes = bodyRows.map((row) =>
      row.querySelector("th")?.getAttribute("scope"),
    );
    expect(rowScopes.every((scope) => scope === "row")).toBe(true);
  });

  it("is named by the component whose variants it shows", () => {
    const table = renderMatrix(BUTTON, CVA);

    expect(table.querySelector("caption")?.textContent).toContain("Button");
  });

  it("names every frame by the axes it renders, pinned ones included", () => {
    const titles = titlesOf(renderMatrix(BUTTON, CVA));

    expect(titles).toContain("Button, size sm, variant solid, tone neutral");
    expect(titles.every((title) => title.includes("tone neutral"))).toBe(true);
  });
});

describe("a component with no variants", () => {
  it("names its frame by the component alone", () => {
    const frame = renderSinglePreview({ ...BUTTON, cva: undefined });

    expect(frame.getAttribute("title")).toBe("Button");
  });
});
