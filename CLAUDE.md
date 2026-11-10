# Project: Melissa Barbanti — Art Gallery & Admin CMS WebApp

## 1. Tech Stack & Architecture
- **Framework**: Next.js (App Router), TypeScript (strict), Tailwind CSS.
- **Database**: Drizzle ORM + LibSQL/SQLite (`file:local.db` for local dev, Turso in production).
- **Image Handling**: Client-side conversion to WebP (max 1920px, quality 0.82) before upload; local storage fallback in `public/uploads` for dev and S3/Cloudflare R2 compatible adapter for prod.
- **Icons & UI**: `lucide-react`, clean accessible components (no heavy UI libraries unless needed).

## 2. Coding & Git Conventions
- **Code, comments, identifiers, and Git commit messages MUST be in English.**
- **All user-facing UI text, labels, and placeholders MUST be in Italian.**
- Keep files modular (< 200 lines per file). Prefer React Server Components (RSC) by default; add `'use client'` only for interactive forms, lightboxes, and filters.

## 3. Design System
### Public Website ("Chiaroscuro Gallery" — Dark Theme)
- Primary Bg: `#141413` | Card Surface: `#1E1D1B` | Subtle Border: `#2E2C29`
- Primary Text: `#F4F1EA` | Muted Text: `#A39E93` | Accent (Antique Gold): `#C5A059`
- Fonts: `Cormorant Garamond` (Google Font, Serif) for headings, artwork titles, and italic poetry; `Plus Jakarta Sans` (Sans-Serif) for body, dates, and metadata.
- **Critical Rule**: Never crop artwork images in gallery cards; preserve original aspect ratios (masonry/natural layout).

### Admin WebApp (`/admin` — Warm Light Theme)
- Primary Bg: `#F8F7F4` | Card Surface: `#FFFFFF` | Border: `#E5E0D8` | Text: `#141413` | Accent: `#C5A059`
- High legibility, large action buttons, live dark-mode preview where required.

## 4. Database Schema (`src/db/schema.ts`)
1. `paintings`:
   - `id` (PK), `title` (text, req), `slug` (text, unique), `mainImageUrl` (text, req), `detailImagesJson` (text/JSON array of strings), `description` (text, req), `poem` (text, nullable), `date` (text ISO `YYYY-MM-DD`, req), `dimensions` (text, e.g. "60x80 cm"), `technique` (text, e.g. "Olio su tela"), `availability` (text enum: `'available' | 'private_collection'`), `createdAt`.
2. `events`:
   - `id` (PK), `title` (text, req), `slug` (text, unique), `summary` (text, req, short preview), `description` (text, req), `startDate` (text ISO `YYYY-MM-DD`, req), `endDate` (text ISO, nullable), `location` (text, venue & city), `coverImageUrl` (text), `eventImagesJson` (text/JSON array of strings), `createdAt`.
3. `paintings_to_events` (Many-to-Many Join Table):
   - `paintingId` (FK -> paintings.id, cascade), `eventId` (FK -> events.id, cascade), composite PK.
4. `home_settings` (Single-row config, `id = 1`):
   - `mode` (`'auto' | 'manual'`), `heroItemType` (`'painting' | 'event' | null`), `heroItemId` (integer, nullable), `manualSlotsJson` (JSON array of max 7 items: `[{ slot: number, type: 'painting' | 'event', id: number }]`).
5. `profile_settings` (Single-row config, `id = 1`):
   - `avatarUrl` (text), `bioDescription` (text), `profileImagesJson` (JSON array of strings), `instagramUrl` (text), `email` (text).

## 5. Core Business Logic & Routes
- `/` (Home Page): Reads `home_settings`. In `'auto'` mode, fetches latest paintings and events ordered by `date`/`startDate` DESC. In `'manual'` mode, renders the exact 6–7 chosen items from `manualSlotsJson`.
- `/opere` & `/opere/[slug]`: Masonry gallery with filters (year, availability, exhibited). Detail view shows main image + detail thumbnails + zoom lightbox on left; metadata, optional italic poem with gold left border, description, and clickable cards of linked `events` on right.
- `/eventi` & `/eventi/[slug]`: Timeline list. Detail view renders header + **Smart Editorial Layout** (splits `description` on `\n\n`, alternates first 2 paragraphs with first 2 event photos in zig-zag, places all remaining photos in a responsive Bento/Masonry grid) + bottom section showing linked `paintings`.
- `/profilo`: Artist portrait, bio with Smart Editorial Layout alternating `bioDescription` paragraphs and `profileImagesJson`, contact card (`@melissartbarbanti` + email), and brief copyright notice.
- `/note-legali`: Dedicated standalone page for full Terms of Use, Licenses, No-AI scraping clause, and Privacy linked from the global footer.
- `/admin/*`: Protected CMS with Sidebar ("Gestione Home Page", "I miei Dipinti", "Eventi e Mostre", "Profilo e Bio"), full CRUD, bidirectional linking between paintings and events, and On-Demand Revalidation (`revalidatePath`) on every save.