import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore/lite";

import { COLLECTIONS } from "@/config/constants";
import { stripUndefined } from "@/firebase/converters";
import { getDb } from "@/firebase/firestore";
import { AppError, toAppError } from "@/lib/errors";

/**
 * Write layer for the Admin Dashboard.
 *
 * ── Trust model ─────────────────────────────────────────────────────────────
 *
 * These helpers run in the **browser**, as the signed-in administrator, through
 * the ordinary Firebase client SDK. There is no server-side admin path and no
 * Firebase Admin SDK, so the real authorisation boundary is `firestore.rules` —
 * exactly as it is for reads. `PermissionGate` decides which buttons a role
 * sees; the rules decide what the request is actually allowed to do. A tampered
 * client gets `permission-denied`, not a write.
 *
 * ── Guarantees ──────────────────────────────────────────────────────────────
 *
 * - `createdAt` is stamped once, `updatedAt` on every write, both with
 *   `serverTimestamp()` — never the browser clock, which is user-controlled.
 * - `id`, `createdAt` and `updatedAt` are stripped from incoming payloads so a
 *   form can hand over a whole model object without rewriting its own metadata.
 * - `undefined` is removed: Firestore rejects it, and it is the usual shape of
 *   "this optional field was left blank". `null` is preserved, because in this
 *   project `null` is meaningful — it records that the clinic has not supplied a
 *   value, and must never silently become an invented one.
 * - **`admins/*` is refused outright.** Role and privilege changes are a
 *   separate, explicitly-approved concern; no content screen may touch them.
 */

export type WriteResult =
  | { ok: true; id: string }
  | { ok: false; code: AppError["code"]; message: string };

/** Collections a content screen may never write to from here. */
const FORBIDDEN_COLLECTIONS: readonly string[] = [COLLECTIONS.admins];

function assertWritable(collectionName: string): void {
  if (FORBIDDEN_COLLECTIONS.includes(collectionName)) {
    throw new AppError(
      "permissionDenied",
      `[Omega Care] refusing to write to "${collectionName}" from the content ` +
        `write layer — authorisation data is managed separately.`,
    );
  }
}

/** Removes fields the write layer owns, plus every `undefined`. */
function sanitize(data: Record<string, unknown>): DocumentData {
  const copy: Record<string, unknown> = { ...data };
  delete copy.id;
  delete copy.createdAt;
  delete copy.updatedAt;
  return stripUndefined(copy);
}

function failure(error: unknown): WriteResult {
  const appError = error instanceof AppError ? error : toAppError(error);
  return { ok: false, code: appError.code, message: appError.message };
}

function requireDb() {
  const db = getDb();
  if (!db) throw new AppError("notConfigured", "Firebase is not configured.");
  return db;
}

/* -------------------------------------------------------------------------- */
/*  Create / update / delete                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Creates a document, or fully replaces one at a known ID.
 *
 * Pass `id` when the document's identity is meaningful — the singleton settings
 * documents, or `homepageSections/{key}`. Omit it and Firestore allocates one.
 */
export async function createDocument(
  collectionName: string,
  data: Record<string, unknown>,
  options: { id?: string } = {},
): Promise<WriteResult> {
  try {
    assertWritable(collectionName);
    const db = requireDb();

    const reference = doc(db, collectionName, options.id ?? generateLocalId());

    await setDoc(reference, {
      ...sanitize(data),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { ok: true, id: reference.id };
  } catch (error) {
    return failure(error);
  }
}

/** Partial update. Untouched fields keep their stored values. */
export async function updateDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
): Promise<WriteResult> {
  try {
    assertWritable(collectionName);
    const db = requireDb();

    await updateDoc(doc(db, collectionName, id), {
      ...sanitize(data),
      updatedAt: serverTimestamp(),
    });

    return { ok: true, id };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Merge-write at a fixed ID: creates the document if it is missing, updates it
 * otherwise. Used for the singleton documents (`clinicSettings/site`,
 * `paymentMethods/default`, `socialLinks/default`, `founder/profile`,
 * `homepageSections/{key}`), which must survive being edited before they have
 * ever been created.
 */
export async function upsertDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
): Promise<WriteResult> {
  try {
    assertWritable(collectionName);
    const db = requireDb();

    await setDoc(
      doc(db, collectionName, id),
      { ...sanitize(data), updatedAt: serverTimestamp() },
      { merge: true },
    );

    return { ok: true, id };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Hides a record from the public site without destroying it.
 *
 * This is the dashboard's default "delete": clinic records are referenced by
 * schedules, prices, services and — from Phase 6 — appointments, so removing
 * the document would orphan them. Deactivating is reversible and keeps history
 * intact.
 */
export async function setRecordActive(
  collectionName: string,
  id: string,
  active: boolean,
): Promise<WriteResult> {
  return updateDocument(collectionName, id, { active });
}

/**
 * Permanent deletion. The UI must require a typed confirmation before calling
 * this, and should prefer `setRecordActive(false)` in every ordinary case.
 */
export async function deleteDocument(
  collectionName: string,
  id: string,
): Promise<WriteResult> {
  try {
    assertWritable(collectionName);
    const db = requireDb();
    await deleteDoc(doc(db, collectionName, id));
    return { ok: true, id };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Persists a new display order.
 *
 * Written one document at a time rather than as a batch: the lists here hold
 * tens of records, a partial failure leaves a still-valid (if uneven) ordering,
 * and the caller gets told exactly which row failed.
 */
export async function reorderDocuments(
  collectionName: string,
  orderedIds: string[],
  step = 10,
): Promise<WriteResult> {
  for (const [index, id] of orderedIds.entries()) {
    const result = await updateDocument(collectionName, id, {
      sortOrder: (index + 1) * step,
    });
    if (!result.ok) return result;
  }
  return { ok: true, id: orderedIds.join(",") };
}

/* -------------------------------------------------------------------------- */

/**
 * A client-side document ID, in Firestore's own 20-character alphabet.
 *
 * `doc(collection(db, name))` would allocate one too, but generating it here
 * makes the ID available to the caller *before* the write — which is what lets
 * a form create a doctor and attach that doctor's schedules and prices in the
 * same submit.
 */
export function generateLocalId(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let id = "";
  for (const byte of bytes) id += alphabet[byte % alphabet.length];
  return id;
}
