import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";
import { saveImage } from "@/lib/storage";

// Vercel rejects request bodies above 4.5 MB, so cap one compressed image at 4 MB.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// WebP files start with "RIFF....WEBP"
function isWebp(buf: Buffer): boolean {
  return (
    buf.length > 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  );
}

export async function POST(request: Request) {
  // Defense in depth: the proxy also checks, but the route must never trust it alone.
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  // Cheap early rejection before the body is buffered (multipart overhead is small).
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "File troppo grande (max 4 MB)" }, { status: 413 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File troppo grande (max 4 MB)" }, { status: 413 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isWebp(buffer)) {
    return NextResponse.json({ error: "Sono accettate solo immagini WebP" }, { status: 415 });
  }
  try {
    // The stored name is always server-generated; the client filename is never used.
    const { url } = await saveImage(buffer);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[upload] storage failure", e);
    return NextResponse.json({ error: "Salvataggio non riuscito, riprova" }, { status: 500 });
  }
}
