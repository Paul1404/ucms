import { count, eq } from "drizzle-orm";
import { db } from "../../db";
import { pages, posts, users } from "../../db/schema";
import { protectedProcedure, publicProcedure } from "../base";

export const metaRouter = {
  // Whether the instance still needs its first admin account.
  needsSetup: publicProcedure.handler(async () => {
    const [row] = await db.select({ value: count() }).from(users);
    return { needsSetup: (row?.value ?? 0) === 0 };
  }),

  // Counts for the admin dashboard.
  stats: protectedProcedure.handler(async () => {
    const [pageCount] = await db.select({ value: count() }).from(pages);
    const [postCount] = await db.select({ value: count() }).from(posts);
    const [publishedPosts] = await db
      .select({ value: count() })
      .from(posts)
      .where(eq(posts.published, true));
    return {
      pages: pageCount?.value ?? 0,
      posts: postCount?.value ?? 0,
      publishedPosts: publishedPosts?.value ?? 0,
    };
  }),
};
