"use client";

import { toast } from "sonner";
import { z } from "zod";

import type { WriteResult } from "@/services/admin-writes";

/**
 * Shared building blocks for the dashboard's forms.
 */

/* -------------------------------------------------------------------------- */
/*  Validation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * URL segment: lowercase Latin letters, digits and single hyphens.
 *
 * Arabic slugs are deliberately not allowed. `/doctors/mohamed-abu-zaid` stays
 * readable when pasted into WhatsApp, survives being copied through systems
 * that mangle percent-encoding, and matches the IDs already seeded.
 */
export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/** `HH:mm`, 24-hour, clinic-local. */
export const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** `YYYY-MM-DD`. */
export const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/);

/** A required bilingual pair — both languages must be filled. */
export const bilingualRequired = {
  ar: z.string().trim().min(1),
  en: z.string().trim().min(1),
};

/**
 * A non-negative money amount, or `null`.
 *
 * `null` is a first-class answer here: it records that the clinic has not
 * published a price, and the public site renders "confirmed at reception"
 * rather than a number nobody quoted.
 */
export const optionalMoney = z.number().min(0).nullable();

/** Turns a blank string into `null`, otherwise trims. */
export function toNullable(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

/** Parses a possibly-blank numeric input into `number | null`. */
export function toNullableNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Builds a URL slug from a name.
 *
 * Latin text is transliterated by stripping diacritics; Arabic input yields
 * nothing usable, so the caller keeps the English name as the slug source and
 * the field stays editable. Never silently produces an empty slug.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/* -------------------------------------------------------------------------- */
/*  Write feedback                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Reports the outcome of a write, and reminds the administrator that the
 * public site is cached.
 *
 * The 30-minute edge cache is a real consequence, so every successful save says
 * so plainly — otherwise someone refreshes the public page, sees the old value
 * and concludes the save failed.
 *
 * Returns `true` when the write succeeded, so callers can close a form.
 */
export function reportWrite(
  result: WriteResult,
  messages: {
    saved: string;
    savedDescription?: string;
    failed: string;
    /** Maps an `AppErrorCode` to translated text. */
    describeError: (code: string) => string;
  },
): boolean {
  if (result.ok) {
    toast.success(messages.saved, { description: messages.savedDescription });
    return true;
  }

  toast.error(messages.failed, { description: messages.describeError(result.code) });
  return false;
}
