import type { Catalog } from "@thmh/core";
import { render } from "./render";
import { STYLE } from "./style";

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
