import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AtSign, Mail } from "lucide-react";
import SmartEditorialLayout from "@/components/public/SmartEditorialLayout";
import { parseJsonArray } from "@/lib/format";
import { getProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Profilo & Contatti — Melissa Barbanti",
  description: "Biografia, atelier e contatti di Melissa Barbanti.",
};

const DEFAULT_INSTAGRAM = "https://www.instagram.com/melissartbarbanti";
const INSTAGRAM_HANDLE = "@melissartbarbanti";

async function ProfileContent() {
  const profile = await getProfile();
  const instagram = profile?.instagramUrl || DEFAULT_INSTAGRAM;
  const email = profile?.email;

  return (
    <>
      <header className="flex flex-col items-center text-center">
        {profile?.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt="Ritratto di Melissa Barbanti"
            className="size-44 rounded-full border border-border object-cover md:size-56"
          />
        )}
        <p className="mt-8 text-xs uppercase tracking-[0.25em] text-accent">L&apos;artista</p>
        <h1 className="mt-3 font-serif text-4xl text-fg md:text-6xl">Melissa Barbanti</h1>
      </header>

      {profile?.bioDescription && (
        <div className="mt-16 md:mt-24">
          <SmartEditorialLayout
            text={profile.bioDescription}
            images={parseJsonArray<string>(profile.profileImagesJson)}
            alt="Atelier di Melissa Barbanti"
          />
        </div>
      )}

      <section aria-labelledby="contatti" className="mx-auto mt-24 max-w-xl rounded-sm border border-border bg-surface p-8">
        <h2 id="contatti" className="font-serif text-3xl text-fg">
          Contatti
        </h2>
        <ul className="mt-6 space-y-4">
          <li>
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-fg transition-colors hover:text-accent"
            >
              <AtSign size={20} aria-hidden className="text-accent" />
              {INSTAGRAM_HANDLE}
            </a>
          </li>
          {email && (
            <li>
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 text-fg transition-colors hover:text-accent"
              >
                <Mail size={20} aria-hidden className="text-accent" />
                {email}
              </a>
            </li>
          )}
        </ul>
      </section>

      <p className="mx-auto mt-8 w-fit rounded-full border border-border px-5 py-2 text-xs text-muted">
        © Melissa Barbanti. Tutti i diritti riservati.{" "}
        <Link href="/note-legali" className="text-accent underline-offset-4 hover:underline">
          Note legali
        </Link>
      </p>
    </>
  );
}

export default function ProfiloPage() {
  return (
    <article className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <Suspense fallback={<div className="min-h-[70vh]" />}>
        <ProfileContent />
      </Suspense>
    </article>
  );
}
