import { NextResponse } from "next/server";
import { saveImage } from "@/lib/storage";

const MAX_BYTES = 8 * 1024 * 1024;

// WebP files start with "RIFF....WEBP"
function isWebp(buf: Buffer): boolean {
  return (
    buf.length > 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  );
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File troppo grande (max 8 MB)" }, { status: 413 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isWebp(buffer)) {
    return NextResponse.json({ error: "Sono accettate solo immagini WebP" }, { status: 415 });
  }
  const { url } = await saveImage(buffer);
  return NextResponse.json({ url });
}
