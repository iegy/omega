/**
 * Cloudflare Cache API layer for the **public** Firestore read models.
 *
 * ── Why ─────────────────────────────────────────────────────────────────────
 *
 * OpenNext runs with no incremental cache (no R2, no KV, no Durable Object), so
 * every request re-renders and re-reads Firestore. Measured, the homepage costs
 * ~180 document reads; the Spark free tier allows 50,000/day, i.e. roughly 280
 * homepage views before the site starts serving fallback content.
 *
 * This module caches the *datasets* rather than the pages, in Cloudflare's
 * built-in Cache API. That is deliberate:
 *
 *   · `/`, `/doctors`, `/specialties`, `/services`, a doctor profile and the
 *     aesthetics page all need the same doctors/specialties/schedules/prices.
 *     Caching the dataset means the first request to *any* of them warms the
 *     data for *all* of them, instead of each route warming its own copy.
 *   · The cached payload is plain JSON, so it stays valid across page shapes and
 *     across both locales — one entry serves Arabic and English.
 *
 * No new Cloudflare resource is involved: `caches.default` is part of the
 * Workers runtime. Nothing here is billable.
 *
 * ── What may be cached ──────────────────────────────────────────────────────
 *
 * Only the publicly readable clinic and catalogue content listed in
 * `PUBLIC_CACHE_GROUPS`. The group name is a closed union, and
 * `assertPublicGroup()` re-checks it at runtime, so it is not possible to route
 * admin sessions, Firebase Auth state, appointments, patient submissions, lab
 * sample requests or payment verification data through here — every one of
 * those is read on an authenticated path that never calls this module.
 *
 * ── Failure behaviour ───────────────────────────────────────────────────────
 *
 * The cache is strictly an optimisation. Any problem — no Cache API (Node during
 * `next build` or `npm run dev`), a malformed entry, a `put()` rejection —
 * degrades to reading Firestore directly. The public site never fails because of
 * this file.
 */

import { isBuildPhase } from "./build-cache";
import { readFailureCount } from "./firestore-access";

/* -------------------------------------------------------------------------- */
/*  Configuration                                                              */
/* -------------------------------------------------------------------------- */

/**
 * How long a public dataset stays cached at the edge, in seconds.
 *
 * **30 minutes**, and this is the single place to change it.
 *
 * Chosen against the Spark allowance rather than by feel: at a 5-minute TTL a
 * single continuously-hit Cloudflare colo could cost
 * `180 × 12 × 24 = 51,840` reads/day for the homepage dataset alone — already
 * over the 50,000/day limit before other routes, builds, bots or additional
 * colos. At 30 minutes the same worst case is `180 × 2 × 24 = 8,640`, which
 * leaves comfortable room for every other group, several builds a day and
 * multiple colos.
 *
 * The operational consequence, which the Phase 5 dashboard states plainly to
 * staff: **a content change can take up to 30 minutes to appear publicly.**
 */
export const PUBLIC_CACHE_TTL_SECONDS = 30 * 60;

/**
 * Bump when the shape of any cached payload changes.
 *
 * The version is part of the cache key, so a deploy that changes a read model
 * can never read a stale entry written by the previous shape.
 */
export const PUBLIC_CACHE_SCHEMA_VERSION = "v1";

/**
 * The complete list of cacheable public datasets. Adding a group here is a
 * deliberate act; nothing else can be cached.
 *
 * - `settings`   — clinicSettings/site, paymentMethods, socialLinks, homepageSections
 * - `doctors`    — doctors + specialties + active schedules + public prices
 * - `catalog`    — services + service categories
 * - `lab`        — public lab profile + lab units
 * - `founder`    — the public founder profile
 * - `promotions` — live offers + published testimonials
 */
export const PUBLIC_CACHE_GROUPS = [
  "settings",
  "doctors",
  "catalog",
  "lab",
  "founder",
  "promotions",
] as const;

export type PublicCacheGroup = (typeof PUBLIC_CACHE_GROUPS)[number];

/**
 * Internal, non-routable origin for the synthetic cache keys.
 *
 * The Cache API is keyed by Request URL. Using a private hostname keeps these
 * entries in their own namespace, unable to collide with — or be served in
 * place of — any real page or asset URL.
 */
const CACHE_KEY_ORIGIN = "https://public-cache.omega-care.internal";

function assertPublicGroup(group: PublicCacheGroup): void {
  if (!PUBLIC_CACHE_GROUPS.includes(group)) {
    throw new Error(
      `[Omega Care] refusing to cache unknown group "${String(group)}" — only ` +
        `publicly readable clinic content may use the public cache.`,
    );
  }
}

function cacheKey(group: PublicCacheGroup): string {
  return `${CACHE_KEY_ORIGIN}/${PUBLIC_CACHE_SCHEMA_VERSION}/${group}`;
}

/* -------------------------------------------------------------------------- */
/*  Observability                                                             */
/* -------------------------------------------------------------------------- */

export type PublicCacheOutcome = "HIT" | "MISS" | "BYPASS";

/**
 * One line per lookup: outcome, group, and how long the read took.
 *
 * Deliberately contains no clinic data, no patient data and no keys — just the
 * group name, which is a fixed identifier from the list above. This is what
 * makes it safe to leave enabled in production, where it shows up in
 * `wrangler tail` and in the Workers observability logs.
 */
function logCache(
  outcome: PublicCacheOutcome,
  group: PublicCacheGroup,
  ms: number,
  detail?: string,
): void {
  const suffix = detail ? ` ${detail}` : "";
  console.log(
    `[Omega Care][cache] ${outcome} group=${group} ${Math.round(ms)}ms${suffix}`,
  );
}

/* -------------------------------------------------------------------------- */
/*  Runtime detection                                                         */
/* -------------------------------------------------------------------------- */

/** The subset of the Workers Cache API this module uses. */
interface WorkersCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

/**
 * Resolves `caches.default`, or `null` outside the Workers runtime.
 *
 * Node has no `caches`, and a browser's `caches` has `open()` but no `default`,
 * so both are treated as "no cache available" and fall through to Firestore.
 * The build phase always bypasses: `build-cache.ts` already memoises the whole
 * build in-process, and writing build-time reads into an edge cache would be
 * both pointless and a way to publish data from an older build.
 */
function resolveCache(): WorkersCache | null {
  if (isBuildPhase()) return null;

  const globalCaches = (globalThis as { caches?: { default?: unknown } }).caches;
  const candidate = globalCaches?.default;

  if (
    candidate &&
    typeof (candidate as WorkersCache).match === "function" &&
    typeof (candidate as WorkersCache).put === "function"
  ) {
    return candidate as WorkersCache;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*  The read-through cache                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Returns `group`'s dataset from the edge cache, or loads it from Firestore and
 * stores it for `PUBLIC_CACHE_TTL_SECONDS`.
 *
 * A HIT performs **zero** Firestore reads — that is the whole point. A MISS,
 * a BYPASS, an unparseable entry or a failed write all fall back to `load()`,
 * so behaviour is always correct and only the read cost changes.
 *
 * `load()` must return JSON-serialisable data. Every read model in this project
 * already does: the Firestore converters turn `Timestamp` into ISO strings
 * precisely so values survive the RSC boundary, which makes them survive JSON
 * too.
 */
export async function readPublicCacheGroup<T>(
  group: PublicCacheGroup,
  load: () => Promise<T>,
): Promise<T> {
  assertPublicGroup(group);

  const started = Date.now();
  const cacheStore = resolveCache();

  if (!cacheStore) {
    const data = await load();
    logCache("BYPASS", group, Date.now() - started);
    return data;
  }

  const request = new Request(cacheKey(group), { method: "GET" });

  // ── Read ────────────────────────────────────────────────────────────────
  try {
    const cached = await cacheStore.match(request);
    if (cached) {
      const data = (await cached.json()) as T;
      logCache("HIT", group, Date.now() - started);
      return data;
    }
  } catch (error) {
    // A corrupt or half-written entry must never take the site down; fall
    // through and read Firestore instead.
    logCache(
      "MISS",
      group,
      Date.now() - started,
      `unreadable=${error instanceof Error ? error.name : "unknown"}`,
    );
  }

  // ── Load ────────────────────────────────────────────────────────────────
  //
  // The failure counter is sampled either side of the load. Reads never throw
  // (they degrade to an empty value so the site stays up), so this is the only
  // way to tell "genuinely empty" from "Firestore was unreachable" — and
  // caching the second one would pin an empty website for the full TTL.
  const failuresBefore = readFailureCount();
  const data = await load();
  const readFailed = readFailureCount() > failuresBefore;

  if (readFailed) {
    logCache("MISS", group, Date.now() - started, "nocache=read-failed");
    return data;
  }

  // ── Write ───────────────────────────────────────────────────────────────
  try {
    await cacheStore.put(
      request,
      new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          // `max-age` is what gives the entry its TTL inside the Cache API.
          "cache-control": `public, max-age=${PUBLIC_CACHE_TTL_SECONDS}`,
          // Cosmetic, but makes an entry obvious in a cache dump.
          "x-omega-cache-group": group,
        },
      }),
    );
  } catch {
    // Writing is best-effort. The data has already been loaded and is about to
    // be returned; a failed write only means the next request pays for it too.
  }

  logCache("MISS", group, Date.now() - started);
  return data;
}

/** Human-readable TTL for admin copy, e.g. "30". */
export const PUBLIC_CACHE_TTL_MINUTES = Math.round(PUBLIC_CACHE_TTL_SECONDS / 60);
