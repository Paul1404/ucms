import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import * as v from "valibot";
import { db } from "../../db";
import { posts } from "../../db/schema";
import { postInputSchema, slugSchema } from "../../validation";
import { protectedProcedure, publicProcedure } from "../base";

export const postsRouter = {
  // Published posts for the public news feed, newest first.
  published: publicProcedure
    .input(v.optional(v.object({ limit: v.optional(v.number()) }), {}))
    .handler(async ({ input }) => {
      const rows = await db
        .select()
        .from(posts)
        .where(eq(posts.published, true))
        .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
        .limit(input.limit ?? 50);
      return rows;
    }),

  bySlug: publicProcedure.input(v.object({ slug: slugSchema })).handler(async ({ input }) => {
    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, input.slug), eq(posts.published, true)))
      .limit(1);
    if (!post) throw new ORPCError("NOT_FOUND", { message: "Post not found" });
    return post;
  }),

  // --- admin ---
  list: protectedProcedure.handler(async () => {
    return db.select().from(posts).orderBy(desc(posts.createdAt));
  }),

  byId: protectedProcedure.input(v.object({ id: v.string() })).handler(async ({ input }) => {
    const [post] = await db.select().from(posts).where(eq(posts.id, input.id)).limit(1);
    if (!post) throw new ORPCError("NOT_FOUND", { message: "Post not found" });
    return post;
  }),

  create: protectedProcedure.input(postInputSchema).handler(async ({ input, context }) => {
    const existing = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, input.slug));
    if (existing.length > 0) {
      throw new ORPCError("CONFLICT", { message: "A post with this slug already exists" });
    }
    const [created] = await db
      .insert(posts)
      .values({
        ...input,
        authorId: context.user.id,
        publishedAt: input.published ? new Date() : null,
      })
      .returning();
    return created;
  }),

  update: protectedProcedure
    .input(v.object({ id: v.string(), data: postInputSchema }))
    .handler(async ({ input }) => {
      const [current] = await db.select().from(posts).where(eq(posts.id, input.id)).limit(1);
      if (!current) throw new ORPCError("NOT_FOUND", { message: "Post not found" });

      const conflict = await db
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.slug, input.data.slug));
      if (conflict.some((row) => row.id !== input.id)) {
        throw new ORPCError("CONFLICT", { message: "A post with this slug already exists" });
      }

      // Stamp publishedAt the first time a post goes live.
      const publishedAt =
        input.data.published && !current.publishedAt ? new Date() : current.publishedAt;

      const [updated] = await db
        .update(posts)
        .set({ ...input.data, publishedAt, updatedAt: new Date() })
        .where(eq(posts.id, input.id))
        .returning();
      return updated;
    }),

  remove: protectedProcedure.input(v.object({ id: v.string() })).handler(async ({ input }) => {
    const [deleted] = await db.delete(posts).where(eq(posts.id, input.id)).returning();
    if (!deleted) throw new ORPCError("NOT_FOUND", { message: "Post not found" });
    return { id: deleted.id };
  }),
};
