import { eq } from "drizzle-orm";
import { db } from "../../db";
import { siteSettings } from "../../db/schema";
import { settingsInputSchema } from "../../validation";
import { protectedProcedure, publicProcedure } from "../base";

const DEFAULT_ID = "default";

const defaults = {
  id: DEFAULT_ID,
  siteName: "ucms",
  tagline: null as string | null,
  description: null as string | null,
  footerText: null as string | null,
  contactEmail: null as string | null,
};

async function loadSettings() {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, DEFAULT_ID))
    .limit(1);
  return row ?? { ...defaults, updatedAt: new Date() };
}

export const settingsRouter = {
  get: publicProcedure.handler(async () => loadSettings()),

  update: protectedProcedure.input(settingsInputSchema).handler(async ({ input }) => {
    const [saved] = await db
      .insert(siteSettings)
      .values({ id: DEFAULT_ID, ...input, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: { ...input, updatedAt: new Date() },
      })
      .returning();
    return saved;
  }),
};
