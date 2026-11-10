import ImageMasonry from "./ImageMasonry";

type Props = { text: string; images: string[]; alt?: string };

const ZIGZAG_ROWS = 2;

function Paragraph({ children }: { children: string }) {
  return <p className="whitespace-pre-line text-lg leading-[1.85] text-fg/90">{children}</p>;
}

/**
 * Editorial layout: the first two paragraphs alternate with the first two
 * images in a zig-zag, remaining paragraphs flow in a readable column, and
 * all other images land in a masonry grid with lightbox.
 */
export default function SmartEditorialLayout({ text, images, alt = "Immagine" }: Props) {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);
  const photos = images.filter(Boolean);

  const rows = paragraphs.slice(0, ZIGZAG_ROWS).map((p, i) => ({ text: p, image: photos[i] }));
  const rest = paragraphs.slice(ZIGZAG_ROWS);
  const gridImages = photos.slice(rows.filter((r) => r.image).length);

  return (
    <div className="space-y-16 md:space-y-24">
      {rows.map((row, i) =>
        row.image ? (
          <div key={i} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
            <div className={i % 2 === 1 ? "md:order-2" : undefined}>
              <Paragraph>{row.text}</Paragraph>
            </div>
            <div className={i % 2 === 1 ? "md:order-1" : undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={row.image}
                alt={`${alt} — foto ${i + 1}`}
                loading="lazy"
                className="block h-auto w-full rounded-sm border border-border"
              />
            </div>
          </div>
        ) : (
          <div key={i} className="mx-auto max-w-2xl">
            <Paragraph>{row.text}</Paragraph>
          </div>
        ),
      )}

      {rest.length > 0 && (
        <div className="mx-auto max-w-2xl space-y-6">
          {rest.map((p, i) => (
            <Paragraph key={i}>{p}</Paragraph>
          ))}
        </div>
      )}

      {gridImages.length > 0 && <ImageMasonry images={gridImages} alt={alt} />}
    </div>
  );
}
