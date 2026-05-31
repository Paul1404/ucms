import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { siteMembers, sites } from "./db/schema";

export interface ActingUser {
  id: string;
  role?: string | null;
}

// Admins may edit every site. Other users may edit a site only if they own it
// or have been added as a member.
export async function canEditSite(user: ActingUser, siteId: string): Promise<boolean> {
  if (user.role === "admin") return true;

  const [owned] = await db
    .select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.ownerId, user.id)))
    .limit(1);
  if (owned) return true;

  const [member] = await db
    .select({ id: siteMembers.id })
    .from(siteMembers)
    .where(and(eq(siteMembers.siteId, siteId), eq(siteMembers.userId, user.id)))
    .limit(1);
  return Boolean(member);
}
