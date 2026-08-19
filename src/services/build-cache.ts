import { AppError, toAppError } from "@/lib/errors";

/**
 * Build-phase safeguards for the Firestore read layer.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 *
 * `next build` prerenders ~196 pages, and each page is its own render scope, so
 * React's `cache()` — which dedupes within one render — does not help across
 * them. Without this module the build re-ran every collection query once per
 * page: roughly 170 document reads × 196 pages ≈ 30,000+ reads for a single
 * build, against a Spark free-tier allowance of 50,000 reads per day. Two or
 * three builds exhausted the daily quota, and the next build then quietly
 * prerendered "no data" pages.
 *
 * So during the build phase — and only then — reads are memoised for the whole
 * process. The 196-page build now costs one pass over each collection.
 *
 * ── And why it also throws ──────────────────────────────────────────────────
 *
 * `safeList` / `safeGet` deliberately never throw: at runtime a Firestore
 * hiccup must degrade to a fallback render rather than a 500, which is what
 * keeps the public site up. At *build* time that same behaviour is dangerous —
 * a failed read bakes an empty page into static HTML that then gets deployed
 * and looks, to a patient, exactly like a clinic with no doctors.
 *
 * `failBuildOnReadError()` turns a genuine read *error* into a build failure. A
 * legitimately empty collection (there are no confirmed offers, and no
 * testimonials) is not an error and still builds — the distinction is that the
 * query succeeded.
 */

/** True while `next build` is prerendering, per Next.js's own env marker. */
export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * `false` when Firebase is not configured at all — a contributor cloning the
 * repo without `.env.local` must still be able to run `npm run build`.
 */
function shouldFailBuild(): boolean {
  return isBuildPhase() && process.env.OMEGA_ALLOW_EMPTY_BUILD !== "1";
}

const buildCache = new Map<string, Promise<unknown>>();

/**
 * Memoises one read for the lifetime of the build process.
 *
 * `context` is already a unique, human-readable description of the query
 * (`listPublicDoctors`, `listDoctorSchedules(doctor-x)`, …), which makes it a
 * correct cache key. Outside the build phase this is a pass-through, so runtime
 * requests keep per-request freshness.
 */
export function withBuildCache<T>(context: string, read: () => Promise<T>): Promise<T> {
  if (!isBuildPhase()) return read();

  const cached = buildCache.get(context);
  if (cached) return cached as Promise<T>;

  const promise = read().catch((error: unknown) => {
    // Never cache a rejection: a transient failure would otherwise poison every
    // remaining page in the build.
    buildCache.delete(context);
    throw error;
  });

  buildCache.set(context, promise);
  return promise;
}

/**
 * Re-throws a read error during the build so the failure is loud.
 *
 * Returns normally at runtime, letting the caller fall back to its safe empty
 * value. Set `OMEGA_ALLOW_EMPTY_BUILD=1` to build without Firestore on purpose.
 */
export function failBuildOnReadError(context: string, error: unknown): void {
  if (!shouldFailBuild()) return;

  const appError = error instanceof AppError ? error : toAppError(error);

  throw new Error(
    [
      `Firestore read failed during the production build: ${context}`,
      `Reason: ${appError.code}${appError.message ? ` — ${appError.message}` : ""}`,
      "",
      "The build was stopped on purpose. Continuing would have prerendered an",
      "empty page and deployed it as if the clinic had no data.",
      "",
      "Common causes:",
      "  · the Firestore daily read quota is exhausted (Spark plan: 50,000/day,",
      "    resets at midnight US Pacific) — check the Firebase console usage tab;",
      "  · firestore.rules were changed and public reads are no longer allowed;",
      "  · no network access from the build environment.",
      "",
      "To build deliberately without Firestore, set OMEGA_ALLOW_EMPTY_BUILD=1.",
    ].join("\n"),
  );
}
