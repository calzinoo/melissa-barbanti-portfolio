import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredFile = { url: string };

const hasS3Config = () =>
  Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_PUBLIC_URL,
  );

function uniqueName(): string {
  return `${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
}

async function saveLocal(buffer: Buffer, name: string): Promise<StoredFile> {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return { url: `/uploads/${name}` };
}

/**
 * S3 / Cloudflare R2 adapter (S3-compatible), used when S3_* env vars are set.
 * Requires `@aws-sdk/client-s3`, to be installed when switching to production storage.
 */
async function saveS3(buffer: Buffer, name: string): Promise<StoredFile> {
  const moduleName = "@aws-sdk/client-s3";
  const { S3Client, PutObjectCommand } = await import(/* webpackIgnore: true */ moduleName);
  const client = new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `uploads/${name}`,
      Body: buffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return { url: `${process.env.S3_PUBLIC_URL!.replace(/\/$/, "")}/uploads/${name}` };
}

export async function saveImage(buffer: Buffer): Promise<StoredFile> {
  const name = uniqueName();
  return hasS3Config() ? saveS3(buffer, name) : saveLocal(buffer, name);
}
