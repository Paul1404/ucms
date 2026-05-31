import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3Client as S3ClientType,
} from "@aws-sdk/client-s3";
import { getEnv } from "./env";

// Object storage abstraction. When the S3 environment variables are present we
// store uploads in the bucket; otherwise the caller falls back to the database.
// This keeps the app runnable locally with no external dependencies while using
// S3 in production.

const env = getEnv();

export const s3Enabled = Boolean(
  env.BUCKET_NAME && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY,
);

let client: S3ClientType | null = null;

function getClient(): S3ClientType {
  if (!client) {
    client = new S3Client({
      region: env.AWS_REGION || "us-east-1",
      endpoint: env.AWS_ENDPOINT_URL_S3 || undefined,
      // Path-style addressing is the safe default for non-AWS S3-compatible
      // providers (Railway, MinIO, etc.).
      forcePathStyle: Boolean(env.AWS_ENDPOINT_URL_S3),
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export interface StoredObject {
  body: Buffer;
  contentType: string;
}

export async function getObject(key: string): Promise<StoredObject | null> {
  try {
    const res = await getClient().send(new GetObjectCommand({ Bucket: env.BUCKET_NAME, Key: key }));
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) return null;
    return {
      body: Buffer.from(bytes),
      contentType: res.ContentType ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await getClient()
    .send(new DeleteObjectCommand({ Bucket: env.BUCKET_NAME, Key: key }))
    .catch(() => {});
}
