import * as v from "valibot";

const EnvSchema = v.object({
  DATABASE_URL: v.pipe(v.string("DATABASE_URL is required"), v.minLength(1)),
  BETTER_AUTH_SECRET: v.pipe(
    v.string("BETTER_AUTH_SECRET is required"),
    v.minLength(16, "BETTER_AUTH_SECRET should be at least 16 characters"),
  ),
  BETTER_AUTH_URL: v.optional(v.string(), "http://localhost:3000"),
  PORT: v.optional(v.string(), "3000"),
});

export type Env = v.InferOutput<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const result = v.safeParse(EnvSchema, process.env);
  if (!result.success) {
    const issues = result.issues
      .map((i) => `  - ${i.path?.[0]?.key ?? "?"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = result.output;
  return cached;
}
