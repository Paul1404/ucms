import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { count } from "drizzle-orm";
import { db, schema } from "./db";
import { getEnv } from "./env";

const env = getEnv();

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
        // Only the first account can be created through sign-up. After that,
        // registration is closed so the public cannot create accounts on a
        // self-hosted instance. Additional editors are added from the admin UI.
        before: async () => {
          const [row] = await db.select({ value: count() }).from(schema.users);
          if ((row?.value ?? 0) > 0) {
            throw new Error("Registration is closed. An administrator must invite new users.");
          }
          return undefined;
        },
      },
    },
  },
  plugins: [tanstackStartCookies()],
});

export type Auth = typeof auth;
