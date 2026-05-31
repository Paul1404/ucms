import { metaRouter } from "./routers/meta";
import { pagesRouter } from "./routers/pages";
import { postsRouter } from "./routers/posts";
import { settingsRouter } from "./routers/settings";

export const router = {
  meta: metaRouter,
  pages: pagesRouter,
  posts: postsRouter,
  settings: settingsRouter,
};

export type AppRouter = typeof router;
