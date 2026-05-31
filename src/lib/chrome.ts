import * as v from "valibot";

// Site header and footer ("chrome") shared across the whole page. These render
// above and below the canvas on both the editor preview and the public site.

export const navLinkSchema = v.object({
  label: v.optional(v.string(), ""),
  url: v.optional(v.string(), ""),
});

export type NavLink = v.InferOutput<typeof navLinkSchema>;

export const headerSchema = v.object({
  enabled: v.optional(v.boolean(), true),
  logoText: v.optional(v.string(), ""),
  logoUrl: v.optional(v.string(), ""),
  links: v.optional(v.array(navLinkSchema), []),
  sticky: v.optional(v.boolean(), true),
  bg: v.optional(v.string(), ""),
  color: v.optional(v.string(), ""),
});

export const footerSchema = v.object({
  enabled: v.optional(v.boolean(), true),
  text: v.optional(v.string(), ""),
  links: v.optional(v.array(navLinkSchema), []),
  bg: v.optional(v.string(), ""),
  color: v.optional(v.string(), ""),
});

export type Header = v.InferOutput<typeof headerSchema>;
export type Footer = v.InferOutput<typeof footerSchema>;

export function defaultHeader(siteName: string): Header {
  return {
    enabled: true,
    logoText: siteName,
    logoUrl: "",
    links: [],
    sticky: true,
    bg: "",
    color: "",
  };
}

export function defaultFooter(siteName: string): Footer {
  return {
    enabled: true,
    text: `© ${new Date().getFullYear()} ${siteName}`,
    links: [],
    bg: "",
    color: "",
  };
}
