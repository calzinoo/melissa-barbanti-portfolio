import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export type Availability = "available" | "private_collection";
export type HomeMode = "auto" | "manual";
export type ItemType = "painting" | "event";
export type ManualSlot = { slot: number; type: ItemType; id: number };

const createdAt = () =>
  text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`);

export const paintings = sqliteTable("paintings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  mainImageUrl: text("main_image_url").notNull(),
  /** JSON array of strings */
  detailImagesJson: text("detail_images_json").notNull().default("[]"),
  description: text("description").notNull(),
  poem: text("poem"),
  /** ISO date YYYY-MM-DD */
  date: text("date").notNull(),
  /** e.g. "60x80 cm" */
  dimensions: text("dimensions"),
  /** e.g. "Olio su tela" */
  technique: text("technique"),
  availability: text("availability", {
    enum: ["available", "private_collection"],
  })
    .$type<Availability>()
    .notNull()
    .default("available"),
  createdAt: createdAt(),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  /** Short preview */
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  /** Venue & city */
  location: text("location"),
  coverImageUrl: text("cover_image_url"),
  /** JSON array of strings */
  eventImagesJson: text("event_images_json").notNull().default("[]"),
  createdAt: createdAt(),
});

export const paintingsToEvents = sqliteTable(
  "paintings_to_events",
  {
    paintingId: integer("painting_id")
      .notNull()
      .references(() => paintings.id, { onDelete: "cascade" }),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.paintingId, t.eventId] }),
    index("paintings_to_events_event_idx").on(t.eventId),
  ],
);

/** Single-row config (id = 1) */
export const homeSettings = sqliteTable("home_settings", {
  id: integer("id").primaryKey().default(1),
  mode: text("mode", { enum: ["auto", "manual"] })
    .$type<HomeMode>()
    .notNull()
    .default("auto"),
  heroItemType: text("hero_item_type", {
    enum: ["painting", "event"],
  }).$type<ItemType | null>(),
  heroItemId: integer("hero_item_id"),
  /** JSON array (max 7) of ManualSlot */
  manualSlotsJson: text("manual_slots_json").notNull().default("[]"),
});

/** Single-row config (id = 1) */
export const profileSettings = sqliteTable("profile_settings", {
  id: integer("id").primaryKey().default(1),
  avatarUrl: text("avatar_url"),
  bioDescription: text("bio_description").notNull().default(""),
  /** JSON array of strings */
  profileImagesJson: text("profile_images_json").notNull().default("[]"),
  instagramUrl: text("instagram_url"),
  email: text("email"),
});

/** Single-row config (id = 1): public site look & feel */
export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  /** Wall preset id, see src/lib/theme.ts */
  wallPreset: text("wall_preset").notNull().default("chiaroscuro"),
  /** Custom main color as #rrggbb; null = default antique gold */
  accentColor: text("accent_color"),
});

export type Painting = typeof paintings.$inferSelect;
export type NewPainting = typeof paintings.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type HomeSettings = typeof homeSettings.$inferSelect;
export type ProfileSettings = typeof profileSettings.$inferSelect;
