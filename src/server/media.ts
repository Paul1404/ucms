import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { media } from "./db/schema";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);

// POST /api/upload — authenticated image upload, stored in the database.
export async function handleUpload(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return Response.json({ error: "Only image files are allowed" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image must be 5 MB or smaller" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(media)
    .values({ mimeType: file.type, data: bytes.toString("base64") })
    .returning({ id: media.id });

  return Response.json({ url: `/media/${row?.id}` });
}

// GET /media/:id — serve a stored image.
export async function handleMedia(id: string): Promise<Response> {
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!row) return new Response("Not found", { status: 404 });
  const bytes = Buffer.from(row.data, "base64");
  return new Response(bytes, {
    headers: {
      "Content-Type": row.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(bytes.length),
    },
  });
}
