import { describe, expect, it } from "vitest";
import { formatDate, slugify } from "./utils";

describe("slugify", () => {
  it("lowercases and dasherizes", () => {
    expect(slugify("About Us")).toBe("about-us");
    expect(slugify("Hello   World")).toBe("hello-world");
  });

  it("strips punctuation and trims dashes", () => {
    expect(slugify("  Café & Bar! ")).toBe("cafe-bar");
    expect(slugify("--Already--Slug--")).toBe("already-slug");
  });

  it("handles empty and symbol-only input", () => {
    expect(slugify("")).toBe("");
    expect(slugify("!!!")).toBe("");
  });
});

describe("formatDate", () => {
  it("formats a date", () => {
    expect(formatDate(new Date("2026-05-31T00:00:00Z"))).toContain("2026");
  });

  it("returns empty string for nullish", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
  });
});
