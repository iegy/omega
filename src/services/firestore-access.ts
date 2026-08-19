import {
  getDoc,
  getDocs,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type Query,
} from "firebase/firestore/lite";

import { isFirebaseConfigured } from "@/firebase/env";
import { AppError, logAppError, toAppError } from "@/lib/errors";

import { failBuildOnReadError, withBuildCache } from "./build-cache";

/**
 * Shared read helpers for every repository.
 *
 * Design rules:
 *  - A read never throws at a UI component. Failures are logged once and the
 *    caller receives a safe empty value, which is what keeps the public site
 *    alive before the database is seeded (spec 15).
 *  - Reads are time-boxed. During `next build` the Firestore client can sit
 *    waiting on a network that is unavailable; a bounded wait turns that into a
 *    fallback render instead of a hung build.
 */

/** Upper bound for a single Firestore read, in milliseconds. */
const READ_TIMEOUT_MS = 8000;

/* -------------------------------------------------------------------------- */
/*  Read-failure counter                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Monotonic count of reads that failed in this isolate.
 *
 * `safeList` / `safeGet` deliberately swallow errors and return an empty value,
 * which keeps the public site up during a Firestore outage. But it also means a
 * caller cannot distinguish "this collection is genuinely empty" from "the read
 * failed" — and the public edge cache must never store the second one, or a
 * transient outage would pin an empty website for the whole 30-minute TTL.
 *
 * `services/public-cache.ts` samples this counter either side of its loader and
 * skips the cache write if it moved. The counter only ever increases, so
 * concurrent requests in one isolate can at worst cause a *missed* cache write,
 * never a poisoned one.
 */
let readFailures = 0;

export function readFailureCount(): number {
  return readFailures;
}

function recordReadFailure(): void {
  readFailures += 1;
}

class TimeoutError extends Error {
  readonly code = "deadline-exceeded";
}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(`Firestore read timed out: ${label}`));
    }, READ_TIMEOUT_MS);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export interface ReadOptions {
  /** Human-readable context used in development logs. */
  context: string;
}

/** Runs a query and returns the mapped documents, or `[]` on any failure. */
export async function safeList<T>(
  query: Query<T> | null,
  { context }: ReadOptions,
): Promise<T[]> {
  if (!query) {
    if (!isFirebaseConfigured() && process.env.NODE_ENV !== "production") {
      console.warn(`[Omega Care] ${context}: Firebase not configured — using fallback.`);
    }
    return [];
  }

  try {
    return await withBuildCache(context, async () => {
      const snapshot = await withTimeout(getDocs(query), context);
      return snapshot.docs.map((document) => document.data());
    });
  } catch (error) {
    recordReadFailure();
    logAppError(context, error);
    failBuildOnReadError(context, error);
    return [];
  }
}

/**
 * Same as `safeList` but keeps the document ID, for collections whose ID carries
 * meaning (e.g. `homepageSections/{sectionKey}`).
 */
export async function safeListWithIds(
  query: Query<DocumentData> | null,
  { context }: ReadOptions,
): Promise<{ id: string; data: DocumentData }[]> {
  if (!query) return [];

  try {
    return await withBuildCache(context, async () => {
      const snapshot = await withTimeout(getDocs(query), context);
      return snapshot.docs.map((document) => ({
        id: document.id,
        data: document.data(),
      }));
    });
  } catch (error) {
    recordReadFailure();
    logAppError(context, error);
    failBuildOnReadError(context, error);
    return [];
  }
}

/** Reads one converted document, or `null` when missing/unavailable. */
export async function safeGet<T>(
  reference: DocumentReference<T> | null,
  { context }: ReadOptions,
): Promise<T | null> {
  if (!reference) return null;

  try {
    return await withBuildCache(context, async () => {
      const snapshot = await withTimeout(getDoc(reference), context);
      return snapshot.exists() ? snapshot.data() : null;
    });
  } catch (error) {
    recordReadFailure();
    logAppError(context, error);
    failBuildOnReadError(context, error);
    return null;
  }
}

/** Reads one raw document snapshot — used for the singleton settings documents. */
export async function safeGetRaw(
  reference: DocumentReference<DocumentData> | null,
  { context }: ReadOptions,
): Promise<DocumentData | null> {
  if (!reference) return null;

  try {
    return await withBuildCache(context, async () => {
      const snapshot: DocumentSnapshot<DocumentData> = await withTimeout(
        getDoc(reference),
        context,
      );
      return snapshot.exists() ? snapshot.data() : null;
    });
  } catch (error) {
    recordReadFailure();
    logAppError(context, error);
    failBuildOnReadError(context, error);
    return null;
  }
}

/**
 * Strict variant for flows that must distinguish "missing" from "failed" —
 * the admin authorisation lookup uses this so a permissions error is never
 * silently reported to the user as "access denied".
 */
export async function requireGet<T>(
  reference: DocumentReference<T> | null,
  { context }: ReadOptions,
): Promise<{ found: true; data: T } | { found: false }> {
  if (!reference) throw new AppError("notConfigured", context);

  try {
    const snapshot = await withTimeout(getDoc(reference), context);
    return snapshot.exists() ? { found: true, data: snapshot.data() } : { found: false };
  } catch (error) {
    throw toAppError(error);
  }
}
