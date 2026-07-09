import { describe, expect, it } from "vitest";
import { truncateText } from "./truncateText";

describe("truncateText", () => {
  it("returns an empty string for nullish values", () => {
    expect(truncateText(null)).toBe("");
    expect(truncateText(undefined)).toBe("");
  });

  it("trims text that does not exceed the max length", () => {
    expect(truncateText("  short text  ", 20)).toBe("short text");
  });

  it("truncates long text and trims trailing whitespace before the ellipsis", () => {
    expect(truncateText("one two three four", 8)).toBe("one two\u2026");
  });
});
