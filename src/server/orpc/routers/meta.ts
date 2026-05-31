import { count } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { publicProcedure } from "../base";

export const metaRouter = {
  // Whether the instance still needs its first admin account.
  needsSetup: publicProcedure.handler(async () => {
    const [row] = await db.select({ value: count() }).from(users);
    return { needsSetup: (row?.value ?? 0) === 0 };
  }),
};
