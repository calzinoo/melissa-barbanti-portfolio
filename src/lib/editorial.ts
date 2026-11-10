export type EditorialRow = { text: string; image: string | null; imageSide: "left" | "right" | null };
export type EditorialLayout = {
  /** First paragraphs, each paired with a photo when one is available (zig-zag). */
  rows: EditorialRow[];
  /** Paragraphs after the zig-zag section. */
  rest: string[];
  /** Photos not used by the zig-zag, shown in the masonry grid. */
  gridImages: string[];
};

export const ZIGZAG_ROWS = 2;

export function splitParagraphs(text: string | null | undefined): string[] {
  return (text ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);
}

export function buildEditorialLayout(
  text: string | null | undefined,
  images: Array<string | null | undefined> | null | undefined,
): EditorialLayout {
  const paragraphs = splitParagraphs(text);
  const photos = (images ?? []).filter((i): i is string => Boolean(i));
  const rows = paragraphs.slice(0, ZIGZAG_ROWS).map((p, i) => ({
    text: p,
    image: photos[i] ?? null,
    // Row 0: text left / image right; row 1 flips (zig-zag).
    imageSide: photos[i] ? (i % 2 === 0 ? ("right" as const) : ("left" as const)) : null,
  }));
  const used = rows.filter((r) => r.image).length;
  return { rows, rest: paragraphs.slice(ZIGZAG_ROWS), gridImages: photos.slice(used) };
}
