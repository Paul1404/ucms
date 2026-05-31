import * as v from "valibot";

// Shared input schemas for content procedures. Centralized so routes stay in
// sync and the rules can be unit tested.

export const slugSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "Slug is required"),
  v.maxLength(120),
  v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only"),
);

const titleSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "Title is required"),
  v.maxLength(200),
);

export const pageInputSchema = v.object({
  slug: slugSchema,
  title: titleSchema,
  content: v.optional(v.string(), ""),
  excerpt: v.optional(v.nullable(v.string())),
  published: v.optional(v.boolean(), false),
  showInNav: v.optional(v.boolean(), true),
  navOrder: v.optional(v.number(), 0),
});

export const postInputSchema = v.object({
  slug: slugSchema,
  title: titleSchema,
  content: v.optional(v.string(), ""),
  excerpt: v.optional(v.nullable(v.string())),
  published: v.optional(v.boolean(), false),
});

export const settingsInputSchema = v.object({
  siteName: v.pipe(v.string(), v.trim(), v.minLength(1, "Site name is required"), v.maxLength(120)),
  tagline: v.optional(v.nullable(v.string())),
  description: v.optional(v.nullable(v.string())),
  footerText: v.optional(v.nullable(v.string())),
  contactEmail: v.optional(v.nullable(v.string())),
});

export type PageInput = v.InferOutput<typeof pageInputSchema>;
export type PostInput = v.InferOutput<typeof postInputSchema>;
export type SettingsInput = v.InferOutput<typeof settingsInputSchema>;
