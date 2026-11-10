import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, eventInput, paintingInput } from "./helpers/test-db";

const h = vi.hoisted(() => ({
  db: undefined as unknown,
  cookie: undefined as string | undefined,
  saved: 0,
  deleted: [] as Array<string | null | undefined>,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (h.cookie ? { name: n, value: h.cookie } : undefined) }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {}, updateTag: () => {}, cacheLife: () => {}, cacheTag: () => {} }));
vi.mock("@/db", () => ({
  get db() {
    return h.db;
  },
}));
vi.mock("@/lib/storage", () => ({
  saveImage: async () => {
    h.saved++;
    return { url: "/uploads/new.webp" };
  },
  deleteStoredFiles: async (urls: Array<string | null | undefined>) => {
    h.deleted.push(...urls);
  },
}));

import * as actions from "@/app/admin/content-actions";
import { MAX_UPLOAD_BYTES, POST as uploadPost } from "@/app/api/upload/route";
import { SESSION_COOKIE, createSessionToken } from "@/lib/auth";

beforeEach(async () => {
  vi.stubEnv("ADMIN_PASSWORD", "segreta-123");
  vi.stubEnv("AUTH_SECRET", "test-secret-0123456789");
  h.db = await createTestDb();
  h.cookie = await createSessionToken();
  h.saved = 0;
  h.deleted = [];
});

describe("POST /api/upload validation", () => {
  const webp = (size = 32) =>
    Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP"), Buffer.alloc(size - 12)]);
  const send = async (body: Buffer | null, authed = true) => {
    const form = new FormData();
    if (body) form.set("file", new File([new Uint8Array(body)], "../../evil name.webp", { type: "image/webp" }));
    const cookie = authed ? `${SESSION_COOKIE}=${h.cookie}` : "";
    return uploadPost(new Request("http://x/api/upload", { method: "POST", body: form, headers: { cookie } }));
  };

  it("rejects unauthenticated requests without storing anything", async () => {
    expect((await send(webp(), false)).status).toBe(401);
    expect(h.saved).toBe(0);
  });

  it("accepts a valid WebP up to the 4 MB limit and ignores the client filename", async () => {
    const res = await send(webp(MAX_UPLOAD_BYTES));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "/uploads/new.webp" });
  });

  it("rejects files larger than 4 MB", async () => {
    const res = await send(webp(MAX_UPLOAD_BYTES + 1));
    expect(res.status).toBe(413);
    expect(h.saved).toBe(0);
  });

  it("rejects non-WebP content even when labelled image/webp", async () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
    const wav = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WAVE"), Buffer.alloc(32)]);
    const svg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>");
    for (const bad of [png, wav, svg, Buffer.from("RIFF")]) {
      expect((await send(bad)).status).toBe(415);
    }
    expect(h.saved).toBe(0);
  });

  it("returns 400 when no file is attached", async () => {
    expect((await send(null)).status).toBe(400);
  });
});

describe("orphaned image cleanup", () => {
  it("update removes only the images dropped from detailImages (and a replaced main image)", async () => {
    const c = await actions.createPaintingAction(
      paintingInput({ mainImageUrl: "/uploads/main.webp", detailImages: ["/uploads/d1.webp", "/uploads/d2.webp"] }),
    );
    const id = (c as { id: number }).id;
    expect(h.deleted).toEqual([]);

    await actions.updatePaintingAction(
      id,
      paintingInput({ mainImageUrl: "/uploads/main.webp", detailImages: ["/uploads/d2.webp"] }),
    );
    expect(h.deleted).toEqual(["/uploads/d1.webp"]);

    h.deleted = [];
    await actions.updatePaintingAction(
      id,
      paintingInput({ mainImageUrl: "/uploads/main2.webp", detailImages: ["/uploads/d2.webp"] }),
    );
    expect(h.deleted).toEqual(["/uploads/main.webp"]);
  });

  it("an unchanged update deletes nothing", async () => {
    const data = paintingInput({ mainImageUrl: "/uploads/m.webp", detailImages: ["/uploads/d.webp"] });
    const id = ((await actions.createPaintingAction(data)) as { id: number }).id;
    await actions.updatePaintingAction(id, data);
    expect(h.deleted).toEqual([]);
  });

  it("deleting a painting deletes all of its images", async () => {
    const id = (
      (await actions.createPaintingAction(
        paintingInput({ mainImageUrl: "/uploads/m.webp", detailImages: ["/uploads/d1.webp", "/uploads/d2.webp"] }),
      )) as { id: number }
    ).id;
    await actions.deletePaintingAction(id);
    expect([...h.deleted].sort()).toEqual(["/uploads/d1.webp", "/uploads/d2.webp", "/uploads/m.webp"]);
  });

  it("events: removed images and a replaced cover are deleted, kept ones are not", async () => {
    const id = (
      (await actions.createEventAction(
        eventInput({ coverImageUrl: "/uploads/c.webp", eventImages: ["/uploads/e1.webp", "/uploads/e2.webp"] }),
      )) as { id: number }
    ).id;
    await actions.updateEventAction(
      id,
      eventInput({ coverImageUrl: "/uploads/c2.webp", eventImages: ["/uploads/e2.webp"] }),
    );
    expect([...h.deleted].sort()).toEqual(["/uploads/c.webp", "/uploads/e1.webp"]);

    h.deleted = [];
    await actions.deleteEventAction(id);
    expect([...h.deleted].sort()).toEqual(["/uploads/c2.webp", "/uploads/e2.webp"]);
  });

  it("profile: a replaced avatar and removed gallery images are deleted", async () => {
    await actions.saveProfileAction({
      bioDescription: "x",
      avatarUrl: "/uploads/a1.webp",
      profileImages: ["/uploads/p1.webp", "/uploads/p2.webp"],
    });
    expect(h.deleted).toEqual([]);
    await actions.saveProfileAction({
      bioDescription: "x",
      avatarUrl: "/uploads/a2.webp",
      profileImages: ["/uploads/p2.webp"],
    });
    expect([...h.deleted].sort()).toEqual(["/uploads/a1.webp", "/uploads/p1.webp"]);
  });

  it("a rejected mutation deletes nothing", async () => {
    const id = ((await actions.createEventAction(eventInput({ coverImageUrl: "/uploads/c.webp" }))) as { id: number }).id;
    const res = await actions.updateEventAction(id, eventInput({ title: "" }));
    expect(res.ok).toBe(false);
    expect(h.deleted).toEqual([]);
  });
});
