import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { pageInputSchema, postInputSchema, settingsInputSchema, slugSchema } from "./validation";

describe("slugSchema", () => {
  it("accepts valid slugs", () => {
    for (const slug of ["about", "about-us", "news-2026", "a"]) {
      expect(v.safeParse(slugSchema, slug).success).toBe(true);
    }
  });

  it("rejects invalid slugs", () => {
    for (const slug of ["About", "with space", "trailing-", "-leading", "with_underscore", ""]) {
      expect(v.safeParse(slugSchema, slug).success).toBe(false);
    }
  });
});

describe("pageInputSchema", () => {
  it("applies defaults for optional fields", () => {
    const result = v.parse(pageInputSchema, { slug: "home", title: "Home" });
    expect(result.content).toBe("");
    expect(result.published).toBe(false);
    expect(result.showInNav).toBe(true);
    expect(result.navOrder).toBe(0);
  });

  it("requires a title", () => {
    expect(v.safeParse(pageInputSchema, { slug: "home", title: "" }).success).toBe(false);
  });
});

describe("postInputSchema", () => {
  it("does not include page-only fields", () => {
    const result = v.parse(postInputSchema, { slug: "hello", title: "Hello" });
    expect("showInNav" in result).toBe(false);
  });
});

describe("settingsInputSchema", () => {
  it("requires a site name", () => {
    expect(v.safeParse(settingsInputSchema, { siteName: "" }).success).toBe(false);
    expect(v.safeParse(settingsInputSchema, { siteName: "My Club" }).success).toBe(true);
  });
});
