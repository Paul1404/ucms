import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import * as v from "valibot";
import type { Block } from "@/lib/blocks";
import { blocksSchema, DEFAULT_CANVAS_HEIGHT } from "@/lib/blocks";
import { defaultFooter, defaultHeader, footerSchema, headerSchema } from "@/lib/chrome";
import { FONTS } from "@/lib/theme";
import { db } from "../../db";
import { siteMembers, sites, users } from "../../db/schema";
import { canEditSite } from "../../permissions";
import { adminProcedure, protectedProcedure, publicProcedure } from "../base";

// Slugs map directly to public URLs (/<slug>), so they must be URL-safe and
// must not collide with the app's own top-level routes.
const RESERVED_SLUGS = new Set([
  "admin",
  "login",
  "setup",
  "api",
  "media",
  "health",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
]);

const slugField = v.pipe(
  v.string(),
  v.trim(),
  v.toLowerCase(),
  v.minLength(2, "Der Adresszusatz braucht mindestens 2 Zeichen"),
  v.maxLength(40),
  v.regex(/^[a-z0-9-]+$/, "Nur Kleinbuchstaben, Zahlen und Bindestriche"),
  v.check((s) => !RESERVED_SLUGS.has(s), "Dieser Adresszusatz ist reserviert"),
);

const SiteInput = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  name: v.pipe(v.string(), v.trim(), v.minLength(1, "Ein Name ist erforderlich"), v.maxLength(120)),
  description: v.optional(v.string(), ""),
  ogImage: v.optional(v.string(), ""),
  font: v.optional(v.picklist(FONTS), "sans"),
  themeColor: v.pipe(v.string(), v.regex(/^#[0-9a-fA-F]{6}$/, "Bitte eine Hex-Farbe wie #4338ca")),
  blocks: blocksSchema,
  header: headerSchema,
  footer: footerSchema,
  canvasHeight: v.optional(v.pipe(v.number(), v.minValue(200)), DEFAULT_CANVAS_HEIGHT),
  canvasHeightTablet: v.optional(v.pipe(v.number(), v.minValue(200))),
  canvasHeightMobile: v.optional(v.pipe(v.number(), v.minValue(200))),
});

async function loadSite(id: string) {
  const [row] = await db.select().from(sites).where(eq(sites.id, id)).limit(1);
  return row;
}

async function requireEdit(
  user: { id: string; role?: string | null },
  siteId: string,
): Promise<void> {
  const allowed = await canEditSite(user, siteId);
  if (!allowed) {
    throw new ORPCError("FORBIDDEN", { message: "Keine Berechtigung für diese Seite." });
  }
}

export const siteRouter = {
  // --- public ---

  // The published site for a given slug. Returns null when nothing is published.
  getPublished: publicProcedure.input(v.object({ slug: v.string() })).handler(async ({ input }) => {
    const [row] = await db.select().from(sites).where(eq(sites.slug, input.slug)).limit(1);
    if (!row?.published) return null;
    return {
      name: row.name,
      description: row.description,
      ogImage: row.ogImage,
      font: row.font,
      themeColor: row.themeColor,
      blocks: row.published,
      header: row.header ?? defaultHeader(row.name),
      footer: row.footer ?? defaultFooter(row.name),
      canvasHeight: row.publishedHeight ?? row.canvasHeight,
      canvasHeightTablet: row.publishedHeightTablet ?? row.canvasHeightTablet,
      canvasHeightMobile: row.publishedHeightMobile ?? row.canvasHeightMobile,
    };
  }),

  // --- editor ---

  // Sites the signed-in user may edit. Admins see everything.
  listMine: protectedProcedure.handler(async ({ context }) => {
    const user = context.user;
    const list = await db.select().from(sites).orderBy(desc(sites.updatedAt));

    let visible = list;
    if (user.role !== "admin") {
      const memberRows = await db
        .select({ siteId: siteMembers.siteId })
        .from(siteMembers)
        .where(eq(siteMembers.userId, user.id));
      const memberOf = new Set(memberRows.map((m) => m.siteId));
      visible = list.filter((s) => s.ownerId === user.id || memberOf.has(s.id));
    }

    return visible.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      themeColor: s.themeColor,
      isPublished: Boolean(s.published),
      isOwner: s.ownerId === user.id,
      updatedAt: s.updatedAt,
    }));
  }),

  // A single site's editable draft.
  getDraft: protectedProcedure
    .input(v.object({ id: v.string() }))
    .handler(async ({ input, context }) => {
      await requireEdit(context.user, input.id);
      const row = await loadSite(input.id);
      if (!row) throw new ORPCError("NOT_FOUND", { message: "Seite nicht gefunden." });
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        ogImage: row.ogImage,
        font: row.font,
        themeColor: row.themeColor,
        blocks: row.draft ?? [],
        header: row.header ?? defaultHeader(row.name),
        footer: row.footer ?? defaultFooter(row.name),
        canvasHeight: row.canvasHeight,
        canvasHeightTablet: row.canvasHeightTablet,
        canvasHeightMobile: row.canvasHeightMobile,
        hasPublished: Boolean(row.published),
        isOwner: row.ownerId === context.user.id,
      };
    }),

  // Create a new empty site. Admin only.
  create: adminProcedure
    .input(
      v.object({
        name: v.pipe(v.string(), v.trim(), v.minLength(1, "Ein Name ist erforderlich")),
        slug: slugField,
      }),
    )
    .handler(async ({ input, context }) => {
      const [existing] = await db
        .select({ id: sites.id })
        .from(sites)
        .where(eq(sites.slug, input.slug))
        .limit(1);
      if (existing) {
        throw new ORPCError("CONFLICT", { message: "Dieser Adresszusatz ist bereits vergeben." });
      }
      const [created] = await db
        .insert(sites)
        .values({
          slug: input.slug,
          name: input.name,
          ownerId: context.user.id,
          header: defaultHeader(input.name),
          footer: defaultFooter(input.name),
          draft: [] as Block[],
        })
        .returning();
      if (!created) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Seite konnte nicht erstellt werden.",
        });
      }
      return { id: created.id, slug: created.slug };
    }),

  // Save the draft without publishing.
  save: protectedProcedure.input(SiteInput).handler(async ({ input, context }) => {
    await requireEdit(context.user, input.id);
    const { id, blocks, canvasHeightTablet, canvasHeightMobile, ...meta } = input;
    await db
      .update(sites)
      .set({
        ...meta,
        draft: blocks,
        canvasHeightTablet: canvasHeightTablet ?? null,
        canvasHeightMobile: canvasHeightMobile ?? null,
        updatedAt: new Date(),
      })
      .where(eq(sites.id, id));
    return { ok: true };
  }),

  // Save the draft and publish it to the public site.
  publish: protectedProcedure.input(SiteInput).handler(async ({ input, context }) => {
    await requireEdit(context.user, input.id);
    const { id, blocks, canvasHeight, canvasHeightTablet, canvasHeightMobile, ...meta } = input;
    await db
      .update(sites)
      .set({
        ...meta,
        draft: blocks,
        published: blocks,
        canvasHeight,
        canvasHeightTablet: canvasHeightTablet ?? null,
        canvasHeightMobile: canvasHeightMobile ?? null,
        publishedHeight: canvasHeight,
        publishedHeightTablet: canvasHeightTablet ?? null,
        publishedHeightMobile: canvasHeightMobile ?? null,
        updatedAt: new Date(),
      })
      .where(eq(sites.id, id));
    return { ok: true };
  }),

  // Unpublish: hide the public site without deleting the draft.
  unpublish: protectedProcedure
    .input(v.object({ id: v.string() }))
    .handler(async ({ input, context }) => {
      await requireEdit(context.user, input.id);
      await db
        .update(sites)
        .set({ published: null, publishedHeight: null, updatedAt: new Date() })
        .where(eq(sites.id, input.id));
      return { ok: true };
    }),

  // Delete a site. Owner or admin only.
  remove: protectedProcedure
    .input(v.object({ id: v.string() }))
    .handler(async ({ input, context }) => {
      const row = await loadSite(input.id);
      if (!row) throw new ORPCError("NOT_FOUND", { message: "Seite nicht gefunden." });
      if (context.user.role !== "admin" && row.ownerId !== context.user.id) {
        throw new ORPCError("FORBIDDEN", { message: "Nur Eigentümer oder Admins dürfen löschen." });
      }
      await db.delete(sites).where(eq(sites.id, input.id));
      return { ok: true };
    }),

  // --- members ---

  listMembers: protectedProcedure
    .input(v.object({ siteId: v.string() }))
    .handler(async ({ input, context }) => {
      await requireEdit(context.user, input.siteId);
      const rows = await db
        .select({
          id: siteMembers.id,
          role: siteMembers.role,
          userId: users.id,
          name: users.name,
          email: users.email,
        })
        .from(siteMembers)
        .innerJoin(users, eq(users.id, siteMembers.userId))
        .where(eq(siteMembers.siteId, input.siteId));
      return rows;
    }),

  // Add an existing user as an editor by email. Owner or admin only.
  addMember: protectedProcedure
    .input(v.object({ siteId: v.string(), email: v.pipe(v.string(), v.email()) }))
    .handler(async ({ input, context }) => {
      const row = await loadSite(input.siteId);
      if (!row) throw new ORPCError("NOT_FOUND", { message: "Seite nicht gefunden." });
      if (context.user.role !== "admin" && row.ownerId !== context.user.id) {
        throw new ORPCError("FORBIDDEN", {
          message: "Nur Eigentümer oder Admins dürfen Mitglieder hinzufügen.",
        });
      }
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);
      if (!user) {
        throw new ORPCError("NOT_FOUND", {
          message: "Kein Konto mit dieser E-Mail. Lade die Person zuerst als Benutzer ein.",
        });
      }
      const [exists] = await db
        .select({ id: siteMembers.id })
        .from(siteMembers)
        .where(and(eq(siteMembers.siteId, input.siteId), eq(siteMembers.userId, user.id)))
        .limit(1);
      if (exists) return { ok: true };
      await db.insert(siteMembers).values({ siteId: input.siteId, userId: user.id });
      return { ok: true };
    }),

  removeMember: protectedProcedure
    .input(v.object({ siteId: v.string(), memberId: v.string() }))
    .handler(async ({ input, context }) => {
      const row = await loadSite(input.siteId);
      if (!row) throw new ORPCError("NOT_FOUND", { message: "Seite nicht gefunden." });
      if (context.user.role !== "admin" && row.ownerId !== context.user.id) {
        throw new ORPCError("FORBIDDEN", {
          message: "Nur Eigentümer oder Admins dürfen Mitglieder entfernen.",
        });
      }
      await db
        .delete(siteMembers)
        .where(and(eq(siteMembers.id, input.memberId), eq(siteMembers.siteId, input.siteId)));
      return { ok: true };
    }),
};
