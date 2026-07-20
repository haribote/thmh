import type { Catalog, ComponentDoc } from "@thmh/core";

export const DEFAULT_LIMIT = 20;

export type MatchField = "name" | "description" | "propName" | "variantOption";

const RANKS: MatchField[] = [
  "name",
  "description",
  "propName",
  "variantOption",
];

export interface Match {
  term: string;
  field: MatchField;
}

export interface SearchResult {
  id: string;
  name: string;
  description?: string;
  matches: Match[];
}

export interface SearchAnswer {
  matched: number;
  total: number;
  results: SearchResult[];
  warnings: string[];
}

function fieldValues(component: ComponentDoc, field: MatchField): string[] {
  switch (field) {
    case "name":
      return [component.name];
    case "description":
      return component.description ? [component.description] : [];
    case "propName":
      return component.props.map((prop) => prop.name);
    case "variantOption":
      return Object.values(component.cva?.variants ?? {}).flatMap((axis) =>
        Object.keys(axis),
      );
  }
}

function matchesFor(component: ComponentDoc, terms: string[]): Match[] | null {
  const matches: Match[] = [];

  for (const term of terms) {
    const hit = RANKS.filter((field) =>
      fieldValues(component, field).some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
    if (hit.length === 0) return null;
    matches.push(...hit.map((field) => ({ term, field })));
  }

  return matches;
}

function rankOf(matches: Match[], terms: string[]): number {
  return Math.max(
    ...terms.map((term) =>
      Math.min(
        ...matches
          .filter((match) => match.term === term)
          .map((match) => RANKS.indexOf(match.field)),
      ),
    ),
  );
}

function summarise(
  component: ComponentDoc,
  matches: Match[],
  queryTerms: string[],
): SearchResult {
  return {
    id: component.id,
    name: component.name,
    ...(component.description ? { description: component.description } : {}),
    matches: [...matches].sort(
      (a, b) =>
        RANKS.indexOf(a.field) - RANKS.indexOf(b.field) ||
        queryTerms.indexOf(a.term) - queryTerms.indexOf(b.term),
    ),
  };
}

export function search(
  catalog: Catalog,
  query: string,
  limit: number = DEFAULT_LIMIT,
): SearchAnswer {
  const queryTerms = [
    ...new Set(query.toLowerCase().split(/\s+/).filter(Boolean)),
  ];

  const found = catalog.components
    .map((component) => ({
      component,
      matches: matchesFor(component, queryTerms),
    }))
    .filter(
      (entry): entry is { component: ComponentDoc; matches: Match[] } =>
        entry.matches !== null,
    )
    .sort(
      (a, b) =>
        rankOf(a.matches, queryTerms) - rankOf(b.matches, queryTerms) ||
        (a.component.id < b.component.id ? -1 : 1),
    );

  return {
    matched: found.length,
    total: catalog.components.length,
    results: found
      .slice(0, limit)
      .map((entry) => summarise(entry.component, entry.matches, queryTerms)),
    warnings: catalog.warnings,
  };
}
