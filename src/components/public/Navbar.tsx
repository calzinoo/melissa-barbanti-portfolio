"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/opere", label: "Opere" },
  { href: "/eventi", label: "Mostre ed Eventi" },
  { href: "/profilo", label: "Profilo & Contatti" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur">
      <nav
        aria-label="Navigazione principale"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"
      >
        <Link href="/" className="font-serif text-2xl tracking-wide text-fg" onClick={() => setOpen(false)}>
          Melissa Barbanti
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`text-sm tracking-wide transition-colors hover:text-accent ${
                  isActive(l.href) ? "text-accent" : "text-muted"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="p-2 text-fg md:hidden"
          aria-label={open ? "Chiudi menu" : "Apri menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <ul id="mobile-menu" className="border-t border-border bg-bg px-6 py-4 md:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`block py-3 font-serif text-2xl ${isActive(l.href) ? "text-accent" : "text-fg"}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
