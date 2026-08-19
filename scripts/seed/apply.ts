import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type Firestore,
} from "firebase/firestore/lite";

import type { SeedPlan, SeedWrite } from "./plan";

/**
 * How the seed treats a document that already exists.
 *
 * `bootstrap` (the default, and the only mode `npm run seed -- --confirm` uses)
 *   Creates what is missing and **skips** what exists. It never issues a write
 *   against an existing document, so nothing entered from the Admin Dashboard
 *   can be clobbered — not a photo URL, not a booking mode, not a description,
 *   not a price the clinic finally confirmed, not a visibility toggle. Seed
 *   values such as `imageUrl: null` or `bookingMode: null` are *first-install
 *   placeholders*, and re-running must not push them back over real data.
 *
 * `sync` (only via the explicit `--force-update` / `--sync` flag)
 *   Overwrites the seeded fields on existing documents. Destructive with
 *   respect to dashboard edits, so the CLI demands a typed confirmation first.
 */
export type SeedMode = "bootstrap" | "sync";

export interface CollectionResult {
  created: number;
  skipped: number;
  updated: number;
}

export interface ApplyResult {
  created: number;
  skipped: number;
  updated: number;
  failed: number;
  byCollection: Record<string, CollectionResult>;
  errors: { path: string; message: string }[];
}

export interface ApplyOptions {
  mode: SeedMode;
  /** Called after each document so the CLI can render progress. */
  onProgress?: (done: number, total: number, path: string) => void;
}

function emptyResult(): ApplyResult {
  return {
    created: 0,
    skipped: 0,
    updated: 0,
    failed: 0,
    byCollection: {},
    errors: [],
  };
}

function bucketFor(result: ApplyResult, collection: string): CollectionResult {
  return (result.byCollection[collection] ??= {
    created: 0,
    skipped: 0,
    updated: 0,
  });
}

/**
 * Writes the plan against deterministic document IDs.
 *
 * `createdAt` is stamped once, at creation. `updatedAt` is only touched when the
 * document is actually written. Both use `serverTimestamp()` — never the clock
 * of the machine running the script.
 */
export async function applySeedPlan(
  db: Firestore,
  plan: SeedPlan,
  options: ApplyOptions,
): Promise<ApplyResult> {
  const result = emptyResult();
  const total = plan.writes.length;
  let done = 0;

  for (const write of plan.writes) {
    const path = `${write.collection}/${write.docId}`;

    try {
      await applyOne(db, write, options.mode, result);
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        path,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    done += 1;
    options.onProgress?.(done, total, path);
  }

  return result;
}

async function applyOne(
  db: Firestore,
  write: SeedWrite,
  mode: SeedMode,
  result: ApplyResult,
): Promise<void> {
  const reference = doc(db, write.collection, write.docId);
  const existing = await getDoc(reference);
  const bucket = bucketFor(result, write.collection);

  if (existing.exists()) {
    if (mode === "bootstrap") {
      // Untouched on purpose — see the `SeedMode` note above.
      bucket.skipped += 1;
      result.skipped += 1;
      return;
    }

    await setDoc(
      reference,
      { ...write.data, updatedAt: serverTimestamp() },
      { merge: true },
    );
    bucket.updated += 1;
    result.updated += 1;
    return;
  }

  await setDoc(reference, {
    ...write.data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  bucket.created += 1;
  result.created += 1;
}

/* -------------------------------------------------------------------------- */
/*  Dry-run probe                                                              */
/* -------------------------------------------------------------------------- */

export interface PlanPreview {
  creates: number;
  existing: number;
  byCollection: Record<string, { creates: number; existing: number }>;
  /** False when Firestore could not be reached; counts are then unknown. */
  probed: boolean;
}

/**
 * Read-only existence probe used by `seed:dry`, so the dry run can report how
 * many documents would actually be *created* versus *skipped* rather than just
 * how many are in the plan.
 *
 * Needs no authentication: every collection the seed targets is publicly
 * readable by design. If Firestore is unreachable (offline, or the rules have
 * not been published yet) the probe degrades to "unknown" instead of failing.
 */
export async function previewSeedPlan(
  db: Firestore,
  plan: SeedPlan,
): Promise<PlanPreview> {
  const preview: PlanPreview = {
    creates: 0,
    existing: 0,
    byCollection: {},
    probed: true,
  };

  for (const write of plan.writes) {
    const bucket = (preview.byCollection[write.collection] ??= {
      creates: 0,
      existing: 0,
    });

    try {
      const snapshot = await getDoc(doc(db, write.collection, write.docId));
      if (snapshot.exists()) {
        bucket.existing += 1;
        preview.existing += 1;
      } else {
        bucket.creates += 1;
        preview.creates += 1;
      }
    } catch {
      preview.probed = false;
      return preview;
    }
  }

  return preview;
}
