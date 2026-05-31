import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { count } from "drizzle-orm";
import { db, schema } from "./db";
import { getEnv } from "./env";

const env = getEnv();

// Public sign-up is closed after the first admin account. Admin-initiated
// invites flip this flag for the duration of the create call so the database
// hook lets the new account through. Safe in a single-process deployment.
let invitationInProgress = false;

export function withInvitation<T>(fn: () => Promise<T>): Promise<T> {
  invitationInProgress = true;
  return fn().finally(() => {
    invitationInProgress = false;
  });
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: {
      users: schema.users,
      sessions: schema.sessions,
      accounts: schema.accounts,
      verifications: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once per day
  },
  databaseHooks: {
    user: {
      create: {
        // Only the first account can be created through public sign-up. After
        // that, registration is closed and additional users are added from the
        // admin UI (which sets `invitationInProgress`). The very first account
        // becomes an admin; invited accounts are plain members.
        before: async (user) => {
          const [row] = await db.select({ value: count() }).from(schema.users);
          const isFirst = (row?.value ?? 0) === 0;
          if (!isFirst && !invitationInProgress) {
            throw new Error("Die Registrierung ist geschlossen. Bitte wende dich an einen Admin.");
          }
          return { data: { ...user, role: isFirst ? "admin" : "member" } };
        },
      },
    },
  },
  plugins: [tanstackStartCookies()],
});

export type Auth = typeof auth;
