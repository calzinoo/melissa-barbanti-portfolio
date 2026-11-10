import { describe, expect, it } from "vitest";
import { buildEditorialLayout, splitParagraphs } from "@/lib/editorial";

const paragraphs = (n: number) => Array.from({ length: n }, (_, i) => `Paragrafo ${i + 1}`);
const text = (n: number) => paragraphs(n).join("\n\n");
const imgs = (n: number) => Array.from({ length: n }, (_, i) => `/img-${i + 1}.webp`);

describe("splitParagraphs", () => {
  it("splits on blank lines and trims", () => {
    expect(splitParagraphs("  uno  \n\ndue\n\n\n\ntre ")).toEqual(["uno", "due", "tre"]);
  });

  it("normalizes Windows line endings", () => {
    expect(splitParagraphs("uno\r\n\r\ndue")).toEqual(["uno", "due"]);
  });

  it("keeps single newlines inside a paragraph (poetry/line breaks)", () => {
    expect(splitParagraphs("riga 1\nriga 2\n\ndue")).toEqual(["riga 1\nriga 2", "due"]);
  });

  it("returns [] for empty, whitespace-only, null and undefined", () => {
    expect(splitParagraphs("")).toEqual([]);
    expect(splitParagraphs("  \n\n  \n\n ")).toEqual([]);
    expect(splitParagraphs(null)).toEqual([]);
    expect(splitParagraphs(undefined)).toEqual([]);
  });
});

describe("a) standard case: 3+ paragraphs, 5+ images", () => {
  const layout = buildEditorialLayout(text(4), imgs(6));

  it("builds 2 zig-zag rows pairing the first two paragraphs with the first two images", () => {
    expect(layout.rows).toHaveLength(2);
    expect(layout.rows[0]).toMatchObject({ text: "Paragrafo 1", image: "/img-1.webp" });
    expect(layout.rows[1]).toMatchObject({ text: "Paragrafo 2", image: "/img-2.webp" });
  });

  it("alternates the image side", () => {
    expect(layout.rows.map((r) => r.imageSide)).toEqual(["right", "left"]);
  });

  it("flows the remaining paragraphs as text", () => {
    expect(layout.rest).toEqual(["Paragrafo 3", "Paragrafo 4"]);
  });

  it("sends all other images to the Bento grid, in order, without repeats", () => {
    expect(layout.gridImages).toEqual(imgs(6).slice(2));
  });
});

describe("b) short text, many images", () => {
  it("1 paragraph, 10 images: one row, 9 in the grid", () => {
    const layout = buildEditorialLayout("Solo un paragrafo.", imgs(10));
    expect(layout.rows).toHaveLength(1);
    expect(layout.rows[0].image).toBe("/img-1.webp");
    expect(layout.rest).toEqual([]);
    expect(layout.gridImages).toEqual(imgs(10).slice(1));
  });

  it("no image is lost or duplicated", () => {
    const layout = buildEditorialLayout(text(2), imgs(10));
    const used = [...layout.rows.map((r) => r.image), ...layout.gridImages];
    expect(used).toEqual(imgs(10));
  });
});

describe("c) long text, few or no images", () => {
  it("5 paragraphs, 0 images: text only, no grid", () => {
    const layout = buildEditorialLayout(text(5), []);
    expect(layout.rows).toHaveLength(2);
    expect(layout.rows.every((r) => r.image === null && r.imageSide === null)).toBe(true);
    expect(layout.rest).toEqual(["Paragrafo 3", "Paragrafo 4", "Paragrafo 5"]);
    expect(layout.gridImages).toEqual([]);
  });

  it("5 paragraphs, 1 image: only the first row has an image", () => {
    const layout = buildEditorialLayout(text(5), imgs(1));
    expect(layout.rows[0].image).toBe("/img-1.webp");
    expect(layout.rows[1].image).toBeNull();
    expect(layout.rest).toHaveLength(3);
    expect(layout.gridImages).toEqual([]);
  });
});

describe("d) empty inputs", () => {
  it("empty text and empty images yield an empty layout", () => {
    expect(buildEditorialLayout("", [])).toEqual({ rows: [], rest: [], gridImages: [] });
  });

  it("empty text with images: everything goes to the grid", () => {
    const layout = buildEditorialLayout("", imgs(3));
    expect(layout.rows).toEqual([]);
    expect(layout.gridImages).toEqual(imgs(3));
  });

  it("null/undefined inputs and blank image entries do not throw", () => {
    expect(buildEditorialLayout(null, null)).toEqual({ rows: [], rest: [], gridImages: [] });
    const layout = buildEditorialLayout("Uno\n\nDue", ["", null, "/a.webp", undefined, "/b.webp"]);
    expect(layout.rows.map((r) => r.image)).toEqual(["/a.webp", "/b.webp"]);
    expect(layout.gridImages).toEqual([]);
  });
});
