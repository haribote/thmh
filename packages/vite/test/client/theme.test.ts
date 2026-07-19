import { describe, expect, it } from "vitest";
import { STYLE } from "../../src/client/style";

function luminance(hex: string): number {
  const channels = [1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return (
    0.2126 * (channels[0] ?? 0) +
    0.7152 * (channels[1] ?? 0) +
    0.0722 * (channels[2] ?? 0)
  );
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

function darkBlock(): string {
  const match = STYLE.match(
    /@media \(prefers-color-scheme: dark\) \{([\s\S]*)\}/,
  );
  return match?.[1] ?? "";
}

function declared(block: string, property: string, selector: string): string {
  const rule = block.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`));
  const value = rule?.[1]?.match(new RegExp(`${property}:\\s*(#[0-9a-f]{6})`));
  return value?.[1] ?? "";
}

describe("the catalog stylesheet", () => {
  it("has a dark scheme for readers whose environment asks for one", () => {
    expect(darkBlock()).not.toBe("");
  });

  it("keeps text readable against its surface in the dark scheme", () => {
    const block = darkBlock();
    const surface = declared(block, "background", "body");
    const text = declared(block, "color", "body");

    expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the muted file path readable in the dark scheme", () => {
    const block = darkBlock();
    const surface = declared(block, "background", "body");
    const muted = declared(block, "color", "\\.file-path");

    expect(contrast(muted, surface)).toBeGreaterThanOrEqual(4.5);
  });
});
