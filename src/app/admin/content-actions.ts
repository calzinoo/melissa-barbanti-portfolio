"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-guard";
import { deleteStoredFiles } from "@/lib/storage";
import {
  createEvent,
  createPainting,
  deleteEvent,
  deletePainting,
  updateEvent,
  updatePainting,
} from "@/lib/content";
import {
  revalidateContent,
  revalidateHome,
  revalidateProfile,
  revalidateTheme,
} from "@/lib/revalidate";
import type { SiteTheme } from "@/lib/theme";
import {
  saveHomeSettings,
  saveProfile,
  saveSiteTheme,
  type HomeSettingsInput,
  type ProfileInput,
} from "@/lib/settings";
import { validateEvent, validatePainting } from "@/lib/validation";

export type ActionResult = { ok: true; id?: number } | { ok: false; errors: Record<string, string> };

const NOT_FOUND: ActionResult = { ok: false, errors: { _form: "Elemento non trovato" } };

// Server Actions are public POST endpoints: every one calls requireAdmin() FIRST.

export async function createPaintingAction(raw: Record<string, unknown>): Promise<ActionResult> {
  await requireAdmin();
  const v = validatePainting(raw);
  if (!v.ok) return v;
  const { painting, affected } = await createPainting(db, v.data);
  revalidateContent(affected);
  return { ok: true, id: painting.id };
}

export async function updatePaintingAction(
  id: number,
  raw: Record<string, unknown>,
): Promise<ActionResult> {
  await requireAdmin();
  const v = validatePainting(raw);
  if (!v.ok) return v;
  const res = await updatePainting(db, id, v.data);
  if (!res) return NOT_FOUND;
  revalidateContent(res.affected);
  await deleteStoredFiles(res.affected.orphanedUrls ?? []);
  return { ok: true, id };
}

export async function deletePaintingAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const affected = await deletePainting(db, id);
  if (!affected) return NOT_FOUND;
  revalidateContent(affected);
  await deleteStoredFiles(affected.orphanedUrls ?? []);
  return { ok: true };
}

export async function createEventAction(raw: Record<string, unknown>): Promise<ActionResult> {
  await requireAdmin();
  const v = validateEvent(raw);
  if (!v.ok) return v;
  const { event, affected } = await createEvent(db, v.data);
  revalidateContent(affected);
  return { ok: true, id: event.id };
}

export async function updateEventAction(
  id: number,
  raw: Record<string, unknown>,
): Promise<ActionResult> {
  await requireAdmin();
  const v = validateEvent(raw);
  if (!v.ok) return v;
  const res = await updateEvent(db, id, v.data);
  if (!res) return NOT_FOUND;
  revalidateContent(res.affected);
  await deleteStoredFiles(res.affected.orphanedUrls ?? []);
  return { ok: true, id };
}

export async function deleteEventAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const affected = await deleteEvent(db, id);
  if (!affected) return NOT_FOUND;
  revalidateContent(affected);
  await deleteStoredFiles(affected.orphanedUrls ?? []);
  return { ok: true };
}

export async function saveHomeSettingsAction(
  raw: Partial<HomeSettingsInput>,
): Promise<ActionResult> {
  await requireAdmin();
  const res = await db.transaction((tx) => saveHomeSettings(tx, raw));
  if (!res.ok) return res;
  revalidateHome();
  return { ok: true };
}

export async function saveThemeAction(raw: Partial<SiteTheme>): Promise<ActionResult> {
  await requireAdmin();
  const res = await saveSiteTheme(db, raw);
  if (!res.ok) return res;
  revalidateTheme();
  return { ok: true };
}

export async function saveProfileAction(raw: Partial<ProfileInput>): Promise<ActionResult> {
  await requireAdmin();
  const res = await db.transaction((tx) => saveProfile(tx, raw));
  if (!res.ok) return res;
  revalidateProfile();
  await deleteStoredFiles(res.data.orphanedUrls);
  return { ok: true };
}
