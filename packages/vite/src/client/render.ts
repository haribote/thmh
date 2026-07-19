import type { Catalog, ComponentDoc, CvaDoc, PropDoc } from "@thmh/core";

interface VariantAxis {
  name: string;
  options: string[];
}

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

function caption(text: string): HTMLElement {
  return h("caption", { class: "visually-hidden" }, [text]);
}

function frameTitle(
  componentName: string,
  variants: Record<string, string>,
): string {
  const parts = Object.entries(variants).map(
    ([axis, option]) => `${axis} ${option}`,
  );
  return [componentName, ...parts].join(", ");
}

export function renderSinglePreview(component: ComponentDoc): HTMLElement {
  const src = buildPreviewUrl(component.filePath, component.name, {
    children: component.name,
  });
  return h("iframe", {
    src,
    loading: "lazy",
    title: frameTitle(component.name, {}),
  });
}

export function renderMatrix(
  component: ComponentDoc,
  cva: CvaDoc,
): HTMLElement {
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

  const headerRow = h("tr", {}, [
    h("th", { scope: "col" }, [rowAxis ? rowAxis.name : ""]),
  ]);
  for (const columnOption of colAxis.options) {
    headerRow.append(h("th", { scope: "col" }, [columnOption]));
  }

  const table = h("table", {}, [
    caption(`Variants of ${component.name}`),
    headerRow,
  ]);
  const rowOptions = rowAxis ? rowAxis.options : [""];
  for (const rowOption of rowOptions) {
    const row = h("tr", {}, [
      h("th", { scope: "row" }, [rowAxis ? rowOption : ""]),
    ]);
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
      const shown: Record<string, string> = { [colAxis.name]: columnOption };
      if (rowAxis) {
        shown[rowAxis.name] = rowOption;
      }
      const variants = { ...shown, ...pinned };
      row.append(
        h("td", {}, [
          h("iframe", {
            src,
            loading: "lazy",
            title: frameTitle(component.name, variants),
          }),
        ]),
      );
    }
    table.append(row);
  }
  return table;
}

export function renderPropsTable(
  componentName: string,
  props: PropDoc[],
): HTMLElement {
  const headerRow = h(
    "tr",
    {},
    ["name", "type", "required", "default", "description"].map((label) =>
      h("th", { scope: "col" }, [label]),
    ),
  );
  const table = h("table", {}, [
    caption(`Props of ${componentName}`),
    headerRow,
  ]);
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
  section.append(renderPropsTable(component.name, component.props));
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

export function render(app: HTMLElement, catalog: Catalog): void {
  app.replaceChildren();
  app.append(h("h1", {}, ["thmh catalog"]));
  if (catalog.warnings.length > 0) {
    app.append(renderWarnings(catalog.warnings));
  }
  for (const component of catalog.components) {
    app.append(renderComponent(component));
  }
}
