/**
 * Text normalisation shared by the server (which builds the searchable index at
 * render time) and the client filter (which matches against it).
 *
 * Kept in its own module — with no `"use client"` — because a function exported
 * from a client module cannot be called during server rendering.
 */

/** Only what the filter needs; the cards themselves are rendered server-side. */
export interface DoctorFilterRow {
  key: string;
  /** Pre-normalised Arabic + English name and title, for substring matching. */
  haystack: string;
  specialtyIds: string[];
}

export interface SpecialtyOption {
  id: string;
  nameAr: string;
  nameEn: string;
}

/**
 * Folds the spelling variants Egyptian users actually type: diacritics and the
 * tatweel are dropped, the three alef forms collapse to `ا`, `ى` to `ي` and `ة`
 * to `ه`. So "يسرى" finds "يسرا", and "ابو زيد" finds "أبو زيد".
 */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[آأإ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildDoctorHaystack(parts: (string | null)[]): string {
  return normalizeSearchText(parts.filter(Boolean).join(" "));
}
