import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { AppRouter } from "@/server/orpc/router";

// Resolve the absolute RPC endpoint on both the server (during SSR) and the
// browser. The `.server()` body is stripped from the client bundle.
const getRpcUrl = createIsomorphicFn()
  .client(() => `${window.location.origin}/api/rpc`)
  .server(() => `${new URL(getRequest().url).origin}/api/rpc`);

// During SSR the self-call needs the visitor's cookie forwarded so the session
// resolves. In the browser cookies are attached automatically for same-origin.
const getForwardHeaders = createIsomorphicFn()
  .client(() => ({}) as Record<string, string>)
  .server(() => {
    const cookie = getRequest().headers.get("cookie");
    return cookie ? { cookie } : {};
  });

const link = new RPCLink<Record<never, never>>({
  url: () => getRpcUrl(),
  headers: () => getForwardHeaders(),
});

export const client: RouterClient<AppRouter> = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
