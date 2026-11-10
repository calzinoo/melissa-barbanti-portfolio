"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, checkPassword, createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { clientKey, recordFailure, recordSuccess, retryAfterSeconds } from "@/lib/login-throttle";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const key = clientKey(await headers());

  const wait = retryAfterSeconds(key);
  if (wait > 0) return { error: `Troppi tentativi. Riprova tra ${wait} secondi.` };

  if (!checkPassword(password)) {
    const lock = recordFailure(key);
    return {
      error: lock > 0 ? `Password non corretta. Riprova tra ${lock} secondi.` : "Password non corretta. Riprova.",
    };
  }
  recordSuccess(key);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions());

  const next = String(formData.get("next") ?? "");
  // Only same-site admin paths: "//evil.com" or "/admin@x" style values fall back to /admin.
  redirect(/^\/admin(\/[\w\-/]*)?$/.test(next) ? next : "/admin");
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
