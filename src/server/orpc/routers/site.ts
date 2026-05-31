import { eq } from "drizzle-orm";
import * as v from "valibot";
import type { Block } from "@/lib/blocks";
import { blocksSchema } from "@/lib/blocks";
import { db } from "../../db";
import { sites } from "../../db/schema";
import { protectedProcedure, publicProcedure } from "../base";

const SITE_ID = "default";

const SiteInput = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, "Site name is required"), v.maxLength(120)),
  themeColor: v.pipe(v.string(), v.regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #4338ca")),
  blocks: blocksSchema,
});

async function loadSite() {
  const [row] = await db.select().from(sites).where(eq(sites.id, SITE_ID)).limit(1);
  return row;
}

async function upsert(values: {
  name: string;
  themeColor: string;
  draft: Block[];
  published?: Block[];
}) {
  const set = { ...values, updatedAt: new Date() };
  const [saved] = await db
    .insert(sites)
    .values({ id: SITE_ID, ...set })
    .onConflictDoUpdate({ target: sites.id, set })
    .returning();
  return saved;
}

export const siteRouter = {
  // Public: the published one-page site.
  get: publicProcedure.handler(async () => {
    const row = await loadSite();
    return {
      name: row?.name ?? "My Site",
      themeColor: row?.themeColor ?? "#4338ca",
      blocks: row?.published ?? [],
    };
  }),

  // Editor: the draft being worked on.
  getDraft: protectedProcedure.handler(async () => {
    const row = await loadSite();
    return {
      name: row?.name ?? "My Site",
      themeColor: row?.themeColor ?? "#4338ca",
      blocks: row?.draft ?? [],
      hasPublished: Boolean(row?.published),
    };
  }),

  // Save the draft without publishing.
  save: protectedProcedure.input(SiteInput).handler(async ({ input }) => {
    await upsert({ name: input.name, themeColor: input.themeColor, draft: input.blocks });
    return { ok: true };
  }),

  // Save the draft and publish it to the public site.
  publish: protectedProcedure.input(SiteInput).handler(async ({ input }) => {
    await upsert({
      name: input.name,
      themeColor: input.themeColor,
      draft: input.blocks,
      published: input.blocks,
    });
    return { ok: true };
  }),
};
