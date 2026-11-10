// Client-side only: resize to max 1920px and convert to WebP (quality 0.82).
export const MAX_DIMENSION = 1920;
export const WEBP_QUALITY = 0.82;

export async function optimizeToWebp(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponibile");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
  );
  if (!blob || blob.type !== "image/webp") throw new Error("Conversione WebP non supportata");

  const baseName = file.name.replace(/\.[^.]+$/, "") || "immagine";
  return new File([blob], `${baseName}.webp`, { type: "image/webp" });
}

export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", await optimizeToWebp(file));
  const res = await fetch("/api/upload", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Caricamento non riuscito");
  return data.url;
}
