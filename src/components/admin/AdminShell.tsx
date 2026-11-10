"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  Image as ImageIcon,
  LayoutGrid,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";

const NAV = [
  { href: "/admin/home", label: "Gestione Home Page", icon: LayoutGrid },
  { href: "/admin/dipinti", label: "I miei Dipinti", icon: ImageIcon },
  { href: "/admin/eventi", label: "Eventi e Mostre", icon: CalendarDays },
  { href: "/admin/profilo", label: "Profilo e Bio", icon: User },
];

const itemClass = "flex h-12 w-full items-center gap-3 rounded-xl px-3 text-[15px] text-muted hover:bg-bg";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:flex">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <span className="font-serif text-xl font-semibold">Melissa Barbanti</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-border"
        >
          <Menu size={20} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface p-5 transition-transform lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-fg font-serif text-xl font-semibold text-accent">
              m.
            </div>
            <p className="font-serif text-2xl font-semibold leading-tight">Melissa Barbanti</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">
              Il tuo spazio di gestione
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Chiudi menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex h-12 items-center gap-3 rounded-xl px-3 text-[15px] transition ${
                  active ? "bg-accent/15 font-medium text-fg" : "text-muted hover:bg-bg"
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
          <a href="/" target="_blank" rel="noopener noreferrer" className={itemClass}>
            <ExternalLink size={20} />
            Vedi Sito Pubblico ↗
          </a>
          <form action={logoutAction}>
            <button type="submit" className={itemClass}>
              <LogOut size={20} />
              Esci
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
    </div>
  );
}
