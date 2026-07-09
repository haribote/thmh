import type { CvaDoc, VariantAxis } from "./types";

export function deriveAxes(cva: CvaDoc): VariantAxis[] {
  return Object.entries(cva.variants).map(([name, options]) => ({
    name,
    options: Object.keys(options),
  }));
}

export function cartesianProduct(
  axes: VariantAxis[],
): Array<Record<string, string>> {
  return axes.reduce<Array<Record<string, string>>>(
    (combinations, axis) =>
      combinations.flatMap((combination) =>
        axis.options.map((option) => ({ ...combination, [axis.name]: option })),
      ),
    [{}],
  );
}
