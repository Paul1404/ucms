import { boolean, integer, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import type { Block } from "@/lib/blocks";
import type { Footer, Header } from "@/lib/chrome";

// --- better-auth tables (plural names, adapter configured with usePlural) ---

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  // "admin" can manage every site and invite users; "member" can only edit the
  // sites they are assigned to.
  role: text("role").default("admin").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// --- sites ---
// Each row is one website served at /<slug>. `draft` holds the work-in-progress
// canvas shown in the editor; `published` is the public snapshot. Publishing
// copies draft into published. Header and footer render around the canvas.

export const sites = pgTable("sites", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").default("Meine Seite").notNull(),
  description: text("description").default("").notNull(),
  ogImage: text("og_image").default("").notNull(),
  font: text("font").default("sans").notNull(),
  themeColor: text("theme_color").default("#4338ca").notNull(),
  draft: jsonb("draft").$type<Block[]>().default([]).notNull(),
  published: jsonb("published").$type<Block[] | null>(),
  header: jsonb("header").$type<Header | null>(),
  footer: jsonb("footer").$type<Footer | null>(),
  canvasHeight: integer("canvas_height").default(1400).notNull(),
  canvasHeightTablet: integer("canvas_height_tablet"),
  canvasHeightMobile: integer("canvas_height_mobile"),
  publishedHeight: integer("published_height"),
  publishedHeightTablet: integer("published_height_tablet"),
  publishedHeightMobile: integer("published_height_mobile"),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Who may edit which site. The owner is implied by sites.ownerId; this table
// holds the additional invited editors.
export const siteMembers = pgTable(
  "site_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").default("editor").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [unique("site_members_site_user_unique").on(table.siteId, table.userId)],
);

// Uploaded images. When S3 is configured the bytes live in the bucket and
// `storageKey` points at the object; otherwise the bytes are stored in the
// database as base64 in `data`. Served at /media/:id either way.
export const media = pgTable("media", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  siteId: text("site_id").references(() => sites.id, { onDelete: "set null" }),
  mimeType: text("mime_type").notNull(),
  storage: text("storage").default("db").notNull(), // "db" | "s3"
  storageKey: text("storage_key"),
  data: text("data"), // base64 bytes when storage = "db"
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export type Site = typeof sites.$inferSelect;
export type SiteMember = typeof siteMembers.$inferSelect;
export type Media = typeof media.$inferSelect;
export type User = typeof users.$inferSelect;
