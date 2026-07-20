import { describe, expect, it } from "vitest";
import { reportWarnings } from "../src/report";

function collect(): { lines: string[]; write: (chunk: string) => void } {
  const lines: string[] = [];
  return { lines, write: (chunk) => lines.push(chunk) };
}

describe("reportWarnings", () => {
  it("writes one line per warning", () => {
    const { lines, write } = collect();

    reportWarnings(["cva skipped in a.tsx", "Button failed"], write);

    expect(lines).toEqual(["cva skipped in a.tsx\n", "Button failed\n"]);
  });

  it("writes nothing when there are no warnings", () => {
    const { lines, write } = collect();

    reportWarnings([], write);

    expect(lines).toEqual([]);
  });
});
