import { describe, expect, it } from "vitest";
import { parseBuildArgs } from "../src/args";

describe("parseBuildArgs", () => {
  it("rejects an option given no value", () => {
    expect(() => parseBuildArgs(["--root"])).toThrow(/--root/);
  });

  it("rejects an option whose value is another option", () => {
    expect(() => parseBuildArgs(["--root", "--out", "out.json"])).toThrow(
      /--root/,
    );
  });

  it("rejects an unrecognized option", () => {
    expect(() => parseBuildArgs(["--bogus"])).toThrow(/--bogus/);
  });

  it("rejects a positional argument", () => {
    expect(() => parseBuildArgs(["extra"])).toThrow(/extra/);
  });

  it("reads the value of each option given one", () => {
    expect(parseBuildArgs(["--root", "a", "--out", "b"])).toEqual({
      root: "a",
      out: "b",
    });
  });

  it("returns nothing when no option is given", () => {
    expect(parseBuildArgs([])).toEqual({});
  });

  it("reads the analysis options", () => {
    expect(
      parseBuildArgs(["--include", "lib/**/*.tsx", "--tsconfig", "ts.json"]),
    ).toEqual({ include: "lib/**/*.tsx", tsconfig: "ts.json" });
  });
});
