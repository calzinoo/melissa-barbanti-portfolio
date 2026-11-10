import { createClient } from "@libsql/client";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";
import type { Database } from "@/db/types";

/** Isolated in-memory SQLite with the real Drizzle schema. Never touches local.db. */
export async function createTestDb(): Promise<Database> {
  const client = createClient({ url: ":memory:" });
  const empty = await generateSQLiteDrizzleJson({});
  const current = await generateSQLiteDrizzleJson(schema);
  const statements = await generateSQLiteMigration(empty, current);
  for (const sql of statements) await client.execute(sql);
  await client.execute("PRAGMA foreign_keys = ON");
  return drizzle(client, { schema });
}

export const paintingInput = (over: Record<string, unknown> = {}) => ({
  title: "Senza Titolo",
  mainImageUrl: "/uploads/a.webp",
  description: "Una descrizione.",
  date: "2024-01-01",
  ...over,
});

export const eventInput = (over: Record<string, unknown> = {}) => ({
  title: "Mostra",
  summary: "Sommario",
  description: "Descrizione",
  startDate: "2024-05-01",
  ...over,
});
