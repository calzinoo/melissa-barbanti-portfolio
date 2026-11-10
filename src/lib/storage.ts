import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type StoredFile = { url: string };

const hasR2Config = () =>
  Boolean(process.env.R2_BUCKET_NAME && process.env.R2_ACCOUNT_ID);

function uniqueName(): string {
  return `${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
}

async function saveLocal(buffer: Buffer, name: string): Promise<StoredFile> {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return { url: `/uploads/${name}` };
}

/** Cloudflare R2 adapter (S3-compatible), used when R2_BUCKET_NAME and R2_ACCOUNT_ID are set. */
async function saveR2(buffer: Buffer, name: string): Promise<StoredFile> {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: name,
      Body: buffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  return { url: `${base}/${name}` };
}

export async function saveImage(buffer: Buffer): Promise<StoredFile> {
  const name = uniqueName();
  return hasR2Config() ? saveR2(buffer, name) : saveLocal(buffer, name);
}
