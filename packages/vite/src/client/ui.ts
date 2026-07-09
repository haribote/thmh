import type { Catalog, ComponentDoc, CvaDoc, PropDoc } from "@thmh/core";

interface VariantAxis {
  name: string;
  options: string[];
}

const STYLE = `
:root { color-scheme: light dark; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  margin: 0;
  padding: 24px;
  color: #1a1a1a;
  background: #ffffff;
}
h1 { font-size: 20px; margin: 0 0 16px; }
.warnings {
  background: #fff3cd;
  border: 1px solid #ffe69c;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 24px;
  font-size: 13px;
}
.warnings ul { margin: 8px 0 0; padding-left: 20px; }
.component {
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}
.component h2 { margin: 0 0 4px; font-size: 16px; }
.file-path {
  color: #666666;
  font-size: 12px;
  margin: 0 0 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.description { margin: 0 0 12px; font-size: 13px; }
table { border-collapse: collapse; width: 100%; font-size: 12px; margin-top: 8px; }
th, td { border: 1px solid #e2e2e2; padding: 4px 8px; text-align: left; vertical-align: top; }
.cva-badge {
  display: inline-block;
  font-size: 10px;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 4px;
  padding: 1px 6px;
  margin-left: 6px;
}
iframe {
  width: 100%;
  height: 90px;
  border: 1px solid #e2e2e2;
  background: #ffffff;
}
`;

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  for (const child of children) {
    element.append(child);
  }
  return element;
}

function buildPreviewUrl(
  filePath: string,
  exportName: string,
  props: Record<string, unknown>,
): string {
  const params = new URLSearchParams({
    file: filePath,
    export: exportName,
    props: JSON.stringify(props),
  });
  return `/__thmh/preview?${params.toString()}`;
}

function deriveAxes(cva: CvaDoc): VariantAxis[] {
  return Object.entries(cva.variants).map(([name, options]) => ({
    name,
    options: Object.keys(options),
  }));
}

function renderSinglePreview(component: ComponentDoc): HTMLElement {
  const src = buildPreviewUrl(component.filePath, component.name, {
    children: component.name,
  });
  return h("iframe", { src, loading: "lazy" });
}

function renderMatrix(component: ComponentDoc, cva: CvaDoc): HTMLElement {
  const axes = deriveAxes(cva).sort(
    (a, b) => b.options.length - a.options.length,
  );
  if (axes.length === 0) {
    return renderSinglePreview(component);
  }

  const [colAxis, rowAxis, ...remainingAxes] = axes;
  const pinned: Record<string, string> = {};
  for (const axis of remainingAxes) {
    pinned[axis.name] = cva.defaultVariants?.[axis.name] ?? axis.options[0];
  }

  const headerRow = h("tr", {}, [h("th", {}, [rowAxis ? rowAxis.name : ""])]);
  for (const columnOption of colAxis.options) {
    headerRow.append(h("th", {}, [columnOption]));
  }

  const table = h("table", {}, [headerRow]);
  const rowOptions = rowAxis ? rowAxis.options : [""];
  for (const rowOption of rowOptions) {
    const row = h("tr", {}, [h("th", {}, [rowAxis ? rowOption : ""])]);
    for (const columnOption of colAxis.options) {
      const props: Record<string, unknown> = {
        [colAxis.name]: columnOption,
        ...pinned,
        children: component.name,
      };
      if (rowAxis) {
        props[rowAxis.name] = rowOption;
      }
      const src = buildPreviewUrl(component.filePath, component.name, props);
      row.append(h("td", {}, [h("iframe", { src, loading: "lazy" })]));
    }
    table.append(row);
  }
  return table;
}

function renderPropsTable(props: PropDoc[]): HTMLElement {
  const headerRow = h("tr", {}, [
    h("th", {}, ["name"]),
    h("th", {}, ["type"]),
    h("th", {}, ["required"]),
    h("th", {}, ["default"]),
    h("th", {}, ["description"]),
  ]);
  const table = h("table", {}, [headerRow]);
  for (const prop of props) {
    const nameCell = h("td", {}, [prop.name]);
    if (prop.source === "cva") {
      nameCell.append(h("span", { class: "cva-badge" }, ["cva"]));
    }
    table.append(
      h("tr", {}, [
        nameCell,
        h("td", {}, [prop.type]),
        h("td", {}, [String(prop.required)]),
        h("td", {}, [prop.defaultValue ?? ""]),
        h("td", {}, [prop.description ?? ""]),
      ]),
    );
  }
  return table;
}

function renderComponent(component: ComponentDoc): HTMLElement {
  const section = h("section", { class: "component" }, [
    h("h2", {}, [component.name]),
    h("p", { class: "file-path" }, [component.filePath]),
  ]);
  if (component.description) {
    section.append(h("p", { class: "description" }, [component.description]));
  }
  section.append(
    component.cva
      ? renderMatrix(component, component.cva)
      : renderSinglePreview(component),
  );
  section.append(renderPropsTable(component.props));
  return section;
}

function renderWarnings(warnings: string[]): HTMLElement {
  return h("div", { class: "warnings" }, [
    h("strong", {}, ["Warnings"]),
    h(
      "ul",
      {},
      warnings.map((warning) => h("li", {}, [warning])),
    ),
  ]);
}

function render(app: HTMLElement, catalog: Catalog): void {
  app.replaceChildren();
  app.append(h("h1", {}, ["thmh catalog"]));
  if (catalog.warnings.length > 0) {
    app.append(renderWarnings(catalog.warnings));
  }
  for (const component of catalog.components) {
    app.append(renderComponent(component));
  }
}

async function fetchCatalog(): Promise<Catalog> {
  const response = await fetch("/__thmh/api/catalog.json");
  return (await response.json()) as Catalog;
}

async function main(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) {
    return;
  }
  document.head.append(h("style", {}, [STYLE]));

  const catalog = await fetchCatalog();
  render(app, catalog);

  const events = new EventSource("/__thmh/api/events");
  events.addEventListener("catalog-updated", () => {
    location.reload();
  });
}

main().catch((error: unknown) => {
  console.error("[thmh] failed to render catalog", error);
});
