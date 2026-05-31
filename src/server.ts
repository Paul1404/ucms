import { RPCHandler } from "@orpc/server/fetch";
import type { Register } from "@tanstack/react-router";
import {
  createStartHandler,
  defaultStreamHandler,
  type RequestHandler,
} from "@tanstack/react-start/server";
import { auth } from "./server/auth";
import { router } from "./server/orpc/router";

const ssrHandler = createStartHandler(defaultStreamHandler);

const rpcHandler = new RPCHandler(router);

const RPC_PREFIX = "/api/rpc";

async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (pathname === "/api/health" || pathname === "/health") {
    return Response.json({ status: "ok", time: new Date().toISOString() });
  }

  if (pathname.startsWith("/api/auth")) {
    return auth.handler(request);
  }

  if (pathname.startsWith(RPC_PREFIX)) {
    const { matched, response } = await rpcHandler.handle(request, {
      prefix: RPC_PREFIX,
      context: { headers: request.headers },
    });
    if (matched && response) return response;
    return new Response("Not found", { status: 404 });
  }

  return ssrHandler(request);
}

export type ServerEntry = { fetch: RequestHandler<Register> };

export default {
  fetch: handle,
} satisfies ServerEntry;
