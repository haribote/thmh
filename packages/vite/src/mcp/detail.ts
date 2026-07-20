import type { Catalog, ComponentDoc } from "@thmh/core";

export interface DetailAnswer {
  component: ComponentDoc;
  warnings: string[];
}

export function detail(catalog: Catalog, id: string): DetailAnswer | undefined {
  const component = catalog.components.find((entry) => entry.id === id);
  if (!component) return undefined;
  return { component, warnings: catalog.warnings };
}
