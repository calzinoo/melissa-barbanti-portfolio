import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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
const r2Client = () =>
  new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });

async function saveR2(buffer: Buffer, name: string): Promise<StoredFile> {
  await r2Client().send(
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

// Keys we generate look like `1700000000000-1a2b3c4d.webp`; refuse anything else.
const SAFE_KEY = /^[A-Za-z0-9._-]+\.webp$/;

/**
 * Deletes a previously stored image (R2 or public/uploads). Never throws: a file that is
 * already gone, external, or malformed is ignored so DB mutations are never blocked by it.
 * Returns true only when a delete was actually issued.
 */
export async function deleteStoredFile(url: string | null | undefined): Promise<boolean> {
  if (!url) return false;
  try {
    const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
    if (hasR2Config() && base && url.startsWith(`${base}/`)) {
      const key = url.slice(base.length + 1);
      if (!SAFE_KEY.test(key)) return false;
      await r2Client().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
      return true;
    }
    if (url.startsWith("/uploads/")) {
      const name = url.slice("/uploads/".length);
      if (!SAFE_KEY.test(name)) return false;
      await unlink(path.join(process.cwd(), "public", "uploads", name));
      return true;
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code !== "ENOENT") console.error("[storage] delete failed", url, e);
  }
  return false;
}

export async function deleteStoredFiles(urls: Array<string | null | undefined>): Promise<void> {
  await Promise.all([...new Set(urls)].map((u) => deleteStoredFile(u)));
}
