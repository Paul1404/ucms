// Production server. Serves built static assets from dist/client and delegates
// everything else (SSR, /api/*, /health) to the TanStack Start fetch handler.

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join, normalize } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDir = join(__dirname, "dist", "client");
const port = Number(process.env.PORT ?? 3000);

const { default: serverEntry } = await import("./dist/server/server.js");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function contentType(path) {
  const ext = path.slice(path.lastIndexOf("."));
  return MIME[ext] ?? "application/octet-stream";
}

function cacheControl(pathname) {
  // Hashed assets never change; everything else (icons, manifest) caches a day.
  if (pathname.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  return "public, max-age=86400";
}

async function tryServeStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  // Prevent path traversal.
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(clientDir, safe);
  if (!filePath.startsWith(clientDir)) return false;
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return false;
    res.writeHead(200, {
      "Content-Type": contentType(filePath),
      "Content-Length": info.size,
      "Cache-Control": cacheControl(pathname),
    });
    if (req.method === "HEAD") {
      res.end();
      return true;
    }
    createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
}

function toWebRequest(req) {
  const host = req.headers.host ?? `localhost:${port}`;
  const proto = (req.headers["x-forwarded-proto"] ?? "http").toString().split(",")[0];
  const url = `${proto}://${host}${req.url}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) for (const v of value) headers.append(key, v);
    else if (value != null) headers.set(key, value);
  }
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  return new Request(url, {
    method: req.method,
    headers,
    body: hasBody ? Readable.toWeb(req) : undefined,
    duplex: hasBody ? "half" : undefined,
  });
}

async function sendWebResponse(res, response) {
  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  res.writeHead(response.status, headers);
  if (response.body) {
    const nodeStream = Readable.fromWeb(response.body);
    nodeStream.pipe(res);
  } else {
    res.end();
  }
}

const server = createServer(async (req, res) => {
  try {
    const pathname = (req.url ?? "/").split("?")[0];

    if (await tryServeStatic(req, res, pathname)) return;

    const request = toWebRequest(req);
    const response = await serverEntry.fetch(request);
    await sendWebResponse(res, response);
  } catch (error) {
    console.error("[server] request failed:", error instanceof Error ? error.message : error);
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(port, () => {
  console.info(`[server] listening on http://0.0.0.0:${port}`);
});
