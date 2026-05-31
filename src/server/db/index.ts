import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "../env";
import * as schema from "./schema";

const env = getEnv();

// Single shared connection pool. `postgres` handles pooling internally.
const client = postgres(env.DATABASE_URL, {
  max: 10,
  // Silence non-error NOTICE messages (e.g. "table already exists").
  onnotice: () => {},
});

export const db = drizzle(client, { schema });
export { schema };
export type Database = typeof db;
