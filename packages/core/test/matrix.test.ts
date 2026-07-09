import { describe, expect, it } from "vitest";
import { cartesianProduct, deriveAxes } from "../src/matrix";
import type { CvaDoc } from "../src/types";

const buttonCva: CvaDoc = {
  base: "inline-flex",
  variants: {
    variant: {
      default: "bg-primary",
      secondary: "bg-secondary",
      destructive: "bg-destructive",
      outline: "border",
      ghost: "hover:bg-accent",
    },
    size: {
      sm: "h-8",
      default: "h-9",
      lg: "h-10",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
};

describe("deriveAxes", () => {
  it("preserves insertion order of axes and options", () => {
    const axes = deriveAxes(buttonCva);
    expect(axes).toEqual([
      {
        name: "variant",
        options: ["default", "secondary", "destructive", "outline", "ghost"],
      },
      { name: "size", options: ["sm", "default", "lg"] },
    ]);
  });

  it("returns an empty array for a cva doc with no variants", () => {
    const axes = deriveAxes({ variants: {} });
    expect(axes).toEqual([]);
  });
});

describe("cartesianProduct", () => {
  it("produces the full combination set for the button axes", () => {
    const axes = deriveAxes(buttonCva);
    const combinations = cartesianProduct(axes);

    expect(combinations).toHaveLength(15);
    expect(combinations[0]).toEqual({ variant: "default", size: "sm" });
    expect(combinations).toContainEqual({ variant: "ghost", size: "lg" });

    const unique = new Set(combinations.map((combo) => JSON.stringify(combo)));
    expect(unique.size).toBe(15);
  });

  it("returns a single empty combination for no axes", () => {
    expect(cartesianProduct([])).toEqual([{}]);
  });
});
