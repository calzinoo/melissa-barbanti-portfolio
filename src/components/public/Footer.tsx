import Link from "next/link";
import { Mail } from "lucide-react";
import { getContacts } from "@/lib/queries";

const DEFAULT_INSTAGRAM = "https://www.instagram.com/melissartbarbanti";

async function CurrentYear() {
  "use cache";
  return new Date().getFullYear();
}

export default async function Footer() {
  const { instagramUrl, email } = await getContacts();

  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-serif text-xl text-fg">Melissa Barbanti</p>
          <p className="mt-1">© {await CurrentYear()} Melissa Barbanti. Tutti i diritti riservati.</p>
        </div>

        <div className="flex items-center gap-5">
          <a
            href={instagramUrl ?? DEFAULT_INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="transition-colors hover:text-accent"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
          </a>
          {email && (
            <a href={`mailto:${email}`} aria-label="Email" className="transition-colors hover:text-accent">
              <Mail size={20} />
            </a>
          )}
        </div>

        <Link href="/note-legali" className="underline-offset-4 transition-colors hover:text-accent hover:underline">
          Note Legali, Termini d&apos;Uso e Licenze
        </Link>
      </div>
    </footer>
  );
}
