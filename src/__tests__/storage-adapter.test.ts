import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sent = vi.hoisted(() => ({
  commands: [] as Array<{ name: string; input: Record<string, unknown> }>,
  fail: false,
}));

vi.mock("@aws-sdk/client-s3", () => {
  class Cmd {
    constructor(public input: Record<string, unknown>) {}
  }
  return {
    S3Client: class {
      async send(c: Cmd) {
        if (sent.fail) throw new Error("R2 down");
        sent.commands.push({ name: c.constructor.name, input: c.input });
        return {};
      }
    },
    PutObjectCommand: class PutObjectCommand extends Cmd {},
    DeleteObjectCommand: class DeleteObjectCommand extends Cmd {},
  };
});

import { deleteStoredFile, deleteStoredFiles } from "@/lib/storage";

let dir: string;
beforeEach(async () => {
  sent.commands = [];
  sent.fail = false;
  dir = await mkdtemp(path.join(tmpdir(), "storage-test-"));
  await mkdir(path.join(dir, "public", "uploads"), { recursive: true });
  vi.spyOn(process, "cwd").mockReturnValue(dir);
});
afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await rm(dir, { recursive: true, force: true });
});

const uploads = () => readdir(path.join(dir, "public", "uploads"));

describe("deleteStoredFile (local dev)", () => {
  it("removes the file from public/uploads", async () => {
    await writeFile(path.join(dir, "public", "uploads", "1-abc.webp"), "x");
    expect(await deleteStoredFile("/uploads/1-abc.webp")).toBe(true);
    expect(await uploads()).toEqual([]);
  });

  it("fails gracefully when the file is already missing", async () => {
    await expect(deleteStoredFile("/uploads/ghost.webp")).resolves.toBe(false);
  });

  it("ignores external URLs, empty values and path traversal", async () => {
    await writeFile(path.join(dir, "public", "uploads", "keep.webp"), "x");
    await writeFile(path.join(dir, "secret.webp"), "x");
    for (const url of [
      "https://cdn.example.com/x.webp",
      "",
      null,
      undefined,
      "/uploads/../../secret.webp",
      "/uploads/..%2F..%2Fsecret.webp",
      "/uploads/sub/keep.webp",
      "/uploads/keep.png",
    ]) {
      expect(await deleteStoredFile(url), String(url)).toBe(false);
    }
    expect(await uploads()).toEqual(["keep.webp"]);
  });
});

describe("deleteStoredFile (Cloudflare R2)", () => {
  beforeEach(() => {
    vi.stubEnv("R2_BUCKET_NAME", "bucket");
    vi.stubEnv("R2_ACCOUNT_ID", "acct");
    vi.stubEnv("R2_PUBLIC_URL", "https://pub-123.r2.dev/");
  });

  it("issues a DeleteObjectCommand for objects under the public URL", async () => {
    expect(await deleteStoredFile("https://pub-123.r2.dev/1-abc.webp")).toBe(true);
    expect(sent.commands).toEqual([{ name: "DeleteObjectCommand", input: { Bucket: "bucket", Key: "1-abc.webp" } }]);
  });

  it("never touches foreign hosts or unexpected keys", async () => {
    expect(await deleteStoredFile("https://evil.example.com/1-abc.webp")).toBe(false);
    expect(await deleteStoredFile("https://pub-123.r2.dev/folder/other.webp")).toBe(false);
    expect(await deleteStoredFile("https://pub-123.r2.dev/")).toBe(false);
    expect(sent.commands).toEqual([]);
  });

  it("swallows R2 errors so the database mutation is never blocked", async () => {
    sent.fail = true;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(deleteStoredFile("https://pub-123.r2.dev/a.webp")).resolves.toBe(false);
    await expect(
      deleteStoredFiles(["https://pub-123.r2.dev/a.webp", "https://pub-123.r2.dev/b.webp"]),
    ).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
  });

  it("deduplicates URLs", async () => {
    await deleteStoredFiles(["https://pub-123.r2.dev/a.webp", "https://pub-123.r2.dev/a.webp"]);
    expect(sent.commands).toHaveLength(1);
  });
});
