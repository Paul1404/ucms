import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getEnv } from "../env";

// Standalone migrator used at deploy time. Runs migrations from ./drizzle
// without depending on drizzle-kit (a dev dependency).
async function main() {
  const env = getEnv();
  const sql = postgres(env.DATABASE_URL, { max: 1, onnotice: () => {} });
  const db = drizzle(sql);

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.info("[migrate] migrations applied");
  } catch (error) {
    console.error("[migrate] failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
