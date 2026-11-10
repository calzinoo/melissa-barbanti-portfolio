import Link from "next/link";

export default function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 border-b border-border pb-4">
      <h2 className="font-serif text-3xl text-fg md:text-4xl">{title}</h2>
      <Link href={href} className="text-sm text-muted transition-colors hover:text-accent">
        {linkLabel} →
      </Link>
    </div>
  );
}
