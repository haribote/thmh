import type { Catalog } from "@thmh/core";
import { render } from "./render";

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
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
iframe {
  width: 100%;
  height: 90px;
  border: 1px solid #e2e2e2;
  background: #ffffff;
}
`;

function styleElement(): HTMLStyleElement {
  const element = document.createElement("style");
  element.textContent = STYLE;
  return element;
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
  document.head.append(styleElement());

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
