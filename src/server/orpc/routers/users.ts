import { ORPCError } from "@orpc/server";
import { desc, eq } from "drizzle-orm";
import * as v from "valibot";
import { auth, withInvitation } from "../../auth";
import { db } from "../../db";
import { users } from "../../db/schema";
import { adminProcedure } from "../base";

export const usersRouter = {
  // All users. Admin only.
  list: adminProcedure.handler(async () => {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return rows;
  }),

  // Invite a new user by creating their account with a starting password. Admin
  // only. The new account is a plain member that can be assigned to sites.
  invite: adminProcedure
    .input(
      v.object({
        name: v.pipe(v.string(), v.trim(), v.minLength(1, "Ein Name ist erforderlich")),
        email: v.pipe(v.string(), v.email("Bitte eine gültige E-Mail eingeben")),
        password: v.pipe(v.string(), v.minLength(8, "Mindestens 8 Zeichen")),
      }),
    )
    .handler(async ({ input }) => {
      const email = input.email.toLowerCase();
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existing) {
        throw new ORPCError("CONFLICT", { message: "Diese E-Mail wird bereits verwendet." });
      }
      try {
        await withInvitation(() =>
          auth.api.signUpEmail({
            body: { name: input.name, email, password: input.password },
          }),
        );
      } catch (error) {
        throw new ORPCError("BAD_REQUEST", {
          message: error instanceof Error ? error.message : "Konto konnte nicht erstellt werden.",
        });
      }
      return { ok: true };
    }),

  // Delete a user. Admin only. An admin cannot delete their own account.
  remove: adminProcedure.input(v.object({ id: v.string() })).handler(async ({ input, context }) => {
    if (input.id === context.user.id) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Du kannst dein eigenes Konto nicht löschen.",
      });
    }
    await db.delete(users).where(eq(users.id, input.id));
    return { ok: true };
  }),
};
