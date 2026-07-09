export const PREVIEW_ENTRY_ID = "virtual:thmh/preview-entry";
export const RESOLVED_PREVIEW_ENTRY_ID = `\0${PREVIEW_ENTRY_ID}`;

export function generatePreviewEntryCode(cssPath: string): string {
  return `import React from "react";
import { createRoot } from "react-dom/client";

function renderError(message) {
  const root = document.getElementById("root");
  if (root) {
    root.textContent = message;
  }
}

function renderHint(message) {
  const root = document.getElementById("root");
  if (root) {
    const hint = document.createElement("div");
    hint.textContent = message;
    root.appendChild(hint);
  }
}

const cssPath = ${JSON.stringify(cssPath)};
let cssFailed = false;
const cssLoad = import(/* @vite-ignore */ cssPath).catch(() => {
  cssFailed = true;
});

try {
  const params = new URLSearchParams(location.search);
  const file = params.get("file");
  const exportName = params.get("export") ?? "default";
  const props = JSON.parse(params.get("props") ?? "{}");

  if (!file || file.startsWith("/") || file.includes("..") || file.includes(":")) {
    renderError("thmh: invalid \\"file\\" query parameter");
  } else {
    const mod = await import(/* @vite-ignore */ "/" + file);
    const Comp = mod[exportName];
    if (!Comp) {
      renderError(\`thmh: export "\${exportName}" not found in "\${file}"\`);
    } else {
      createRoot(document.getElementById("root")).render(
        React.createElement(Comp, props, props.children),
      );
    }
  }
} catch (error) {
  renderError(\`thmh: \${error instanceof Error ? error.message : String(error)}\`);
}

await cssLoad;
if (cssFailed) {
  renderHint(
    \`thmh: failed to load css "\${cssPath}" — set the css option of thmh()\`,
  );
}
`;
}
