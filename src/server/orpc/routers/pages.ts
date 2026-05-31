import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import * as v from "valibot";
import { db } from "../../db";
import { pages } from "../../db/schema";
import { pageInputSchema, slugSchema } from "../../validation";
import { protectedProcedure, publicProcedure } from "../base";

export const pagesRouter = {
  // Navigation entries for the public site (published only).
  nav: publicProcedure.handler(async () => {
    return db
      .select({ slug: pages.slug, title: pages.title, navOrder: pages.navOrder })
      .from(pages)
      .where(eq(pages.showInNav, true))
      .orderBy(asc(pages.navOrder), asc(pages.title))
      .then((rows) => rows);
  }),

  // A single published page by slug, for public rendering.
  bySlug: publicProcedure.input(v.object({ slug: slugSchema })).handler(async ({ input }) => {
    const [page] = await db.select().from(pages).where(eq(pages.slug, input.slug)).limit(1);
    if (!page?.published) {
      throw new ORPCError("NOT_FOUND", { message: "Page not found" });
    }
    return page;
  }),

  // --- admin ---
  list: protectedProcedure.handler(async () => {
    return db.select().from(pages).orderBy(asc(pages.navOrder), asc(pages.title));
  }),

  byId: protectedProcedure.input(v.object({ id: v.string() })).handler(async ({ input }) => {
    const [page] = await db.select().from(pages).where(eq(pages.id, input.id)).limit(1);
    if (!page) throw new ORPCError("NOT_FOUND", { message: "Page not found" });
    return page;
  }),

  create: protectedProcedure.input(pageInputSchema).handler(async ({ input }) => {
    const existing = await db
      .select({ id: pages.id })
      .from(pages)
      .where(eq(pages.slug, input.slug));
    if (existing.length > 0) {
      throw new ORPCError("CONFLICT", { message: "A page with this slug already exists" });
    }
    const [created] = await db.insert(pages).values(input).returning();
    return created;
  }),

  update: protectedProcedure
    .input(v.object({ id: v.string(), data: pageInputSchema }))
    .handler(async ({ input }) => {
      const conflict = await db
        .select({ id: pages.id })
        .from(pages)
        .where(eq(pages.slug, input.data.slug));
      if (conflict.some((row) => row.id !== input.id)) {
        throw new ORPCError("CONFLICT", { message: "A page with this slug already exists" });
      }
      const [updated] = await db
        .update(pages)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(pages.id, input.id))
        .returning();
      if (!updated) throw new ORPCError("NOT_FOUND", { message: "Page not found" });
      return updated;
    }),

  remove: protectedProcedure.input(v.object({ id: v.string() })).handler(async ({ input }) => {
    const [deleted] = await db.delete(pages).where(eq(pages.id, input.id)).returning();
    if (!deleted) throw new ORPCError("NOT_FOUND", { message: "Page not found" });
    return { id: deleted.id };
  }),
};
