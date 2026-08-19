import type { Locale } from "@/i18n/routing";

/**
 * Firestore `Timestamp` values are converted to ISO-8601 strings by the data
 * layer (`src/firebase/converters.ts`).
 *
 * Why not keep `Timestamp`? Documents cross the React Server Component
 * boundary; a `Timestamp` instance is not serialisable, so every list would
 * have to be mapped again in the UI. ISO strings are serialisable, sortable and
 * unambiguous, and `Africa/Cairo` formatting happens at render time via
 * `next-intl`. Writes convert back to `serverTimestamp()` / `Timestamp`.
 */
export type IsoDateTime = string;

/** Calendar date without a time component, `YYYY-MM-DD`. */
export type IsoDate = string;

/** Wall-clock time of day, `HH:mm` (24h, clinic-local = Africa/Cairo). */
export type TimeOfDay = string;

/** A value that exists in both site languages. */
export interface Bilingual {
  ar: string;
  en: string;
}

export type BilingualNullable = {
  ar: string | null;
  en: string | null;
};

export function pickLocale(value: Bilingual, locale: Locale): string {
  return value[locale] || value.ar;
}

/**
 * Resolves the flat `…Ar` / `…En` pair used by Firestore documents.
 * Falls back to the other language rather than showing an empty string, and
 * returns `null` when neither language has content (spec CV — hide, never invent).
 */
export function localizedText(
  ar: string | null | undefined,
  en: string | null | undefined,
  locale: Locale,
): string | null {
  const primary = locale === "ar" ? ar : en;
  const secondary = locale === "ar" ? en : ar;
  return primary?.trim() || secondary?.trim() || null;
}

/** Fields every Firestore-backed record carries. */
export interface DocumentMeta {
  /** Firestore document ID — always injected by the converter, never stored. */
  id: string;
  createdAt: IsoDateTime | null;
  updatedAt: IsoDateTime | null;
}

/** Bilingual SEO overrides stored on individual records. */
export interface SeoFields {
  seoTitleAr: string | null;
  seoTitleEn: string | null;
  seoDescriptionAr: string | null;
  seoDescriptionEn: string | null;
}

/** 0 = Sunday … 6 = Saturday (matches `Date.getDay()` and Egyptian week order). */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAYS_OF_WEEK: readonly DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

export function isDayOfWeek(value: number): value is DayOfWeek {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

/** Currency is always EGP (spec CH); amounts are stored as plain numbers. */
export type MoneyEgp = number;
