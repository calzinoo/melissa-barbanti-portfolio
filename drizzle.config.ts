import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// drizzle-kit does not load .env.local on its own; reuse Next.js env loading.
loadEnvConfig(process.cwd());

const url = (process.env.DATABASE_URL ?? "file:local.db").trim();
const authToken = process.env.DATABASE_AUTH_TOKEN?.trim();
const isRemote = url.startsWith("libsql://") || url.startsWith("https://");

export default defineConfig({
  // Remote Turso databases need the "turso" dialect; local files use plain sqlite.
  dialect: isRemote ? "turso" : "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: isRemote ? { url, authToken } : { url },
});
