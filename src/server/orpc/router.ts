import { metaRouter } from "./routers/meta";
import { siteRouter } from "./routers/site";
import { usersRouter } from "./routers/users";

export const router = {
  meta: metaRouter,
  site: siteRouter,
  users: usersRouter,
};

export type AppRouter = typeof router;
