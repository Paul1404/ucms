import { RPCHandler } from "@orpc/server/fetch";
import type { Register } from "@tanstack/react-router";
import {
  createStartHandler,
  defaultStreamHandler,
  type RequestHandler,
} from "@tanstack/react-start/server";
import { auth } from "./server/auth";
import { handleMedia, handleUpload } from "./server/media";
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

  if (pathname === "/robots.txt") {
    return new Response(`User-agent: *\nAllow: /\nSitemap: ${url.origin}/sitemap.xml\n`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (pathname === "/sitemap.xml") {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${url.origin}/</loc><changefreq>weekly</changefreq></url></urlset>\n`;
    return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
  }

  if (pathname.startsWith("/api/auth")) {
    return auth.handler(request);
  }

  if (pathname === "/api/upload" && request.method === "POST") {
    return handleUpload(request);
  }

  if (pathname.startsWith("/media/")) {
    return handleMedia(decodeURIComponent(pathname.slice("/media/".length)));
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
