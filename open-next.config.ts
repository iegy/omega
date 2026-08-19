import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext → Cloudflare Workers adapter configuration.
 *
 * Deliberately minimal: **no R2 bucket, no Workers KV namespace, no Durable
 * Object, no Queue.** The clinic runs on free tiers and every extra Cloudflare
 * resource is an extra thing to provision, pay for and secure. Nothing about
 * the Firebase architecture changes — Firestore stays the single source of
 * truth and no clinic or patient data is copied into Cloudflare storage.
 *
 * What that means for `export const revalidate = 300` (the public `(site)`
 * segment):
 *
 *   OpenNext resolves `incrementalCache`, `tagCache` and `queue` to the
 *   built-in `dummy` overrides when they are not configured. A dummy
 *   incremental cache never returns a hit, so an ISR page is simply rendered
 *   on demand for each request. Practical consequences:
 *
 *     • Visitors always see current Firestore content — a dashboard edit is
 *       live immediately, never up to 5 minutes stale.
 *     • Nothing is served from a build-time snapshot, so a redeploy is never
 *       required to publish a content change.
 *     • The cost is one set of Firestore reads per uncached request instead of
 *       one per 5-minute window.
 *
 *   If those reads ever approach the Firestore free-tier quota, the documented
 *   upgrade is an R2 incremental cache plus a Durable Object queue, which
 *   restores true 5-minute ISR. `docs/cloudflare-deployment.md` has the exact
 *   steps. That change adds Cloudflare resources, so it is not made here
 *   without an explicit decision.
 *
 * `enableCacheInterception` is left off: it only helps when a real incremental
 * cache is configured.
 */
export default defineCloudflareConfig();
