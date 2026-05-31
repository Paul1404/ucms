import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { media } from "./db/schema";
import { canEditSite } from "./permissions";
import { getObject, putObject, s3Enabled } from "./storage";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);

function extFor(mime: string): string {
  return (
    {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/svg+xml": "svg",
    }[mime] ?? "bin"
  );
}

// POST /api/upload — authenticated image upload. Stored in S3 when configured,
// otherwise in the database. An optional `siteId` field scopes the upload and
// is checked against the user's edit rights.
export async function handleUpload(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const siteId = (form?.get("siteId") as string | null) || null;
  if (!(file instanceof File)) {
    return Response.json({ error: "Keine Datei übermittelt" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return Response.json({ error: "Nur Bilddateien sind erlaubt" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Das Bild darf höchstens 5 MB groß sein" }, { status: 413 });
  }
  if (siteId) {
    const user = session.user as { id: string; role?: string };
    const allowed = await canEditSite(user, siteId);
    if (!allowed) {
      return Response.json({ error: "Keine Berechtigung für diese Seite" }, { status: 403 });
    }
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const id = crypto.randomUUID();

  if (s3Enabled) {
    const key = `uploads/${id}.${extFor(file.type)}`;
    await putObject(key, bytes, file.type);
    await db
      .insert(media)
      .values({ id, siteId, mimeType: file.type, storage: "s3", storageKey: key });
  } else {
    await db.insert(media).values({
      id,
      siteId,
      mimeType: file.type,
      storage: "db",
      data: bytes.toString("base64"),
    });
  }

  return Response.json({ url: `/media/${id}` });
}

// GET /media/:id — serve a stored image from S3 or the database.
export async function handleMedia(id: string): Promise<Response> {
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!row) return new Response("Not found", { status: 404 });

  const headers = {
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  if (row.storage === "s3" && row.storageKey) {
    const obj = await getObject(row.storageKey);
    if (!obj) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(obj.body), {
      headers: {
        ...headers,
        "Content-Type": row.mimeType || obj.contentType,
        "Content-Length": String(obj.body.length),
      },
    });
  }

  if (!row.data) return new Response("Not found", { status: 404 });
  const bytes = Buffer.from(row.data, "base64");
  return new Response(bytes, {
    headers: {
      ...headers,
      "Content-Type": row.mimeType,
      "Content-Length": String(bytes.length),
    },
  });
}
