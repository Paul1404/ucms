import { metaRouter } from "./routers/meta";
import { siteRouter } from "./routers/site";

export const router = {
  meta: metaRouter,
  site: siteRouter,
};

export type AppRouter = typeof router;
