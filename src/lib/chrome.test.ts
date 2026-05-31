import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { defaultFooter, defaultHeader, footerSchema, headerSchema } from "./chrome";

describe("chrome defaults", () => {
  it("builds a valid header carrying the site name as the logo", () => {
    const header = defaultHeader("Mein Verein");
    expect(header.logoText).toBe("Mein Verein");
    expect(header.enabled).toBe(true);
    expect(v.safeParse(headerSchema, header).success).toBe(true);
  });

  it("builds a valid footer with the site name and current year", () => {
    const footer = defaultFooter("Mein Verein");
    expect(footer.text).toContain("Mein Verein");
    expect(footer.text).toContain(String(new Date().getFullYear()));
    expect(v.safeParse(footerSchema, footer).success).toBe(true);
  });

  it("applies defaults for nav links", () => {
    const parsed = v.parse(headerSchema, { links: [{}] });
    expect(parsed.links[0]?.label).toBe("");
    expect(parsed.links[0]?.url).toBe("");
  });
});
