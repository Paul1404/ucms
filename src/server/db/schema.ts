import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { Block } from "@/lib/blocks";

// --- better-auth tables (plural names, adapter configured with usePlural) ---

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
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

// --- site content ---
// The whole product is a single one-page website. `draft` holds the
// work-in-progress block list shown in the editor; `published` is the public
// snapshot. Publishing copies draft into published.

export const sites = pgTable("sites", {
  id: text("id").primaryKey().default("default"),
  name: text("name").default("My Site").notNull(),
  description: text("description").default("").notNull(),
  ogImage: text("og_image").default("").notNull(),
  font: text("font").default("sans").notNull(),
  draft: jsonb("draft").$type<Block[]>().default([]).notNull(),
  published: jsonb("published").$type<Block[] | null>(),
  themeColor: text("theme_color").default("#4338ca").notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Uploaded images, stored in the database so the app stays self-contained with
// no external object storage to configure. Served at /media/:id.
export const media = pgTable("media", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  mimeType: text("mime_type").notNull(),
  data: text("data").notNull(), // base64-encoded bytes
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export type Site = typeof sites.$inferSelect;
export type Media = typeof media.$inferSelect;
export type User = typeof users.$inferSelect;
