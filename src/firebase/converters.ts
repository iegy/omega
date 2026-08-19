import {
  Timestamp,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type WithFieldValue,
} from "firebase/firestore/lite";

import type { DayOfWeek, IsoDate, TimeOfDay } from "@/types/common";

/* -------------------------------------------------------------------------- */
/*  Primitive readers                                                          */
/*                                                                             */
/*  Firestore documents are untrusted input: a field may be missing, `null`,   */
/*  or of the wrong type after a manual console edit. These readers coerce      */
/*  safely so the rest of the app can rely on the declared TypeScript shape.   */
/* -------------------------------------------------------------------------- */

export function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function readStringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function readNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function readNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function readBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry !== "");
}

export function readArray(value: unknown): DocumentData[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is DocumentData => typeof entry === "object" && entry !== null,
  );
}

/** Reads a value constrained to a literal union, falling back when unknown. */
export function readEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function readEnumOrNull<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

/* -------------------------------------------------------------------------- */
/*  Dates                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Accepts a Firestore `Timestamp`, a `Date`, an epoch number or an ISO string
 * and returns an ISO-8601 string (see the note in `src/types/common.ts` for why
 * the app layer does not carry `Timestamp` instances).
 */
export function readIsoDateTime(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** `YYYY-MM-DD`, also accepting a `Timestamp` written from the console. */
export function readIsoDate(value: unknown): IsoDate | null {
  if (typeof value === "string" && ISO_DATE_PATTERN.test(value)) return value;
  const iso = readIsoDateTime(value);
  return iso ? iso.slice(0, 10) : null;
}

/** `HH:mm` 24-hour clinic-local time. */
export function readTimeOfDay(value: unknown): TimeOfDay | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (TIME_PATTERN.test(trimmed)) return trimmed;
  // Tolerate `9:00` and `09:00:00`.
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed);
  if (!match) return null;
  const hours = Number(match[1]);
  if (hours > 23) return null;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

export function readDayOfWeek(value: unknown, fallback: DayOfWeek = 0): DayOfWeek {
  const numeric = readNumber(value, fallback);
  return (numeric >= 0 && numeric <= 6 ? Math.trunc(numeric) : fallback) as DayOfWeek;
}

/* -------------------------------------------------------------------------- */
/*  Converter factory                                                          */
/* -------------------------------------------------------------------------- */

/** Maps a raw snapshot (id + data) to a fully-formed domain object. */
export type Normalizer<T> = (id: string, data: DocumentData) => T;

/**
 * Builds a Firestore converter from a normalizer.
 *
 * Reads go through the normalizer so `id`, timestamps and optional fields are
 * handled exactly once, in the data layer (spec 13). Writes strip the derived
 * `id` / `createdAt` / `updatedAt` keys — repositories set those explicitly with
 * `serverTimestamp()` so a browser clock can never define them.
 */
export function createConverter<T extends { id: string }>(
  normalize: Normalizer<T>,
): FirestoreDataConverter<T> {
  return {
    // The Firestore *lite* SDK has no snapshot listeners, so `data()` takes no
    // `SnapshotOptions` (there is never pending local state to resolve).
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return normalize(snapshot.id, snapshot.data() ?? {});
    },
    toFirestore(model: WithFieldValue<T>): DocumentData {
      const data: DocumentData = { ...(model as DocumentData) };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      return stripUndefined(data);
    },
  };
}

/**
 * Recursively replaces every Firestore `Timestamp` with an ISO string.
 *
 * Used for the free-form settings document, whose shape is a nested tree rather
 * than a flat record, so the merge step never has to reason about Firestore
 * classes (see `src/lib/deep-merge.ts`).
 */
export function deepNormalizeTimestamps(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(deepNormalizeTimestamps);
  if (typeof value === "object" && value !== null) {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      output[key] = deepNormalizeTimestamps(entry);
    }
    return output;
  }
  return value;
}

/** Firestore rejects `undefined`; convert it to an explicit `null`. */
export function stripUndefined(data: DocumentData): DocumentData {
  const output: DocumentData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    output[key] = value;
  }
  return output;
}
