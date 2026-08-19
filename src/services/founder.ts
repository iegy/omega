import { COLLECTIONS } from "@/config/constants";
import { singletonDoc, SINGLETON_IDS } from "@/firebase/collections";
import { normalizeFounder } from "@/firebase/normalizers";
import type { Founder } from "@/types/founder";

import { cache } from "react";

import { safeGetRaw } from "./firestore-access";
import { readPublicCacheGroup } from "./public-cache";

/**
 * `founder/profile` — one document powering `/founder`, the homepage teaser and
 * Admin → Founder (spec AO / AQ).
 *
 * Returns `null` until the document is seeded in Phase 3; the page then keeps
 * showing the approved Phase 1 shell (official photo + name) instead of empty
 * headings, and never invents a biography or a graduation date (spec CV).
 */
async function loadFounder(): Promise<Founder | null> {
  const data = await safeGetRaw(
    singletonDoc(COLLECTIONS.founder, SINGLETON_IDS.founderProfile),
    { context: "getFounder" },
  );
  if (!data) return null;

  const founder = normalizeFounder(data);
  return founder.active ? founder : null;
}

/* -------------------------------------------------------------------------- */
/*  Public "founder" cache group                                               */
/* -------------------------------------------------------------------------- */

/**
 * The public founder profile, served from the edge cache when warm.
 *
 * Shared by `/founder` and the homepage teaser. The Admin Dashboard uses
 * `getFounderFresh()` so an editor sees their own save immediately.
 */
export const getFounder = cache(
  async (): Promise<Founder | null> =>
    readPublicCacheGroup("founder", async () => {
      const founder = await loadFounder();
      // `null` is a legitimate, cacheable answer: the document may be inactive.
      return founder;
    }),
);

/** Uncached founder document, for the Admin Dashboard. */
export const getFounderFresh = cache(loadFounder);
