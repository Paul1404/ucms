import { ORPCError, os } from "@orpc/server";
import { auth } from "../auth";
import type { User } from "../db/schema";

export interface ORPCContext {
  headers: Headers;
}

export const base = os.$context<ORPCContext>();

/** Open to anyone. Used for reading published content. */
export const publicProcedure = base;

const requireAuth = base.middleware(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session?.user) {
    throw new ORPCError("UNAUTHORIZED", { message: "You must be signed in." });
  }
  return next({
    context: {
      user: session.user as unknown as User,
      session: session.session,
    },
  });
});

/** Requires a valid session. Used for all editing operations. */
export const protectedProcedure = base.use(requireAuth);

const requireAdmin = base.middleware(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session?.user) {
    throw new ORPCError("UNAUTHORIZED", { message: "Du musst angemeldet sein." });
  }
  if ((session.user as unknown as User).role !== "admin") {
    throw new ORPCError("FORBIDDEN", { message: "Nur Administratoren dürfen das." });
  }
  return next({
    context: {
      user: session.user as unknown as User,
      session: session.session,
    },
  });
});

/** Requires an administrator session. Used for site and user management. */
export const adminProcedure = base.use(requireAdmin);
