export const SITE_NAME = "Melissa Barbanti";

/** Absolute site origin for canonical URLs, OpenGraph and the sitemap. */
export function getSiteUrl(env: Record<string, string | undefined> = process.env): string {
  const raw =
    env.NEXT_PUBLIC_SITE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (env.VERCEL_URL && `https://${env.VERCEL_URL}`) ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** AI training scrapers blocked by robots.txt (the No-AI clause in /note-legali). */
export const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "CCBot",
  "Google-Extended",
  "anthropic-ai",
  "ClaudeBot",
  "Bytespider",
] as const;
