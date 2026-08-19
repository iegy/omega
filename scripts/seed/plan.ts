import { COLLECTIONS } from "../../src/config/constants";

import { doctorPriceSeeds, doctorSeeds, scheduleSeeds } from "./data/doctors";
import { founderSeed } from "./data/founder";
import { labProfileSeed, labUnitSeeds } from "./data/lab";
import { categorySeeds, serviceSeeds } from "./data/services";
import {
  homepageSectionSeeds,
  paymentMethodsSeed,
  siteSettingsSeed,
  socialLinksSeed,
  storeContentSeed,
} from "./data/settings";
import { specialtySeeds } from "./data/specialties";

export interface SeedWrite {
  collection: string;
  docId: string;
  data: Record<string, unknown>;
}

export interface SeedPlan {
  writes: SeedWrite[];
  countsByCollection: Record<string, number>;
}

type WithDocId = { docId: string } & Record<string, unknown>;

/** Splits `{ docId, ...fields }` into a write, so `docId` is never stored. */
function fromSeeds(collection: string, seeds: WithDocId[]): SeedWrite[] {
  return seeds.map(({ docId, ...data }) => ({ collection, docId, data }));
}

function singleton(
  collection: string,
  docId: string,
  data: Record<string, unknown>,
): SeedWrite {
  return { collection, docId, data };
}

/**
 * Builds the complete list of documents the seed will write.
 *
 * Pure and side-effect free: `npm run seed:dry` uses exactly this plan to report
 * counts and paths without touching Firestore (spec 32).
 *
 * Intentionally NOT part of the plan:
 *   - `admins/*`        — the seed must never touch authorisation records (spec 35)
 *   - `offers`          — no confirmed offer exists (spec 28)
 *   - `testimonials`    — no real patient reviews exist (spec 29)
 *   - `labServices`     — no test list or price was supplied
 *   - `appointments`, `sampleCollectionRequests` — patient data, created by the
 *     public flows in Phases 7 and 8
 */
export function buildSeedPlan(): SeedPlan {
  const writes: SeedWrite[] = [
    ...fromSeeds(COLLECTIONS.specialties, specialtySeeds),
    ...fromSeeds(COLLECTIONS.doctors, doctorSeeds),
    ...fromSeeds(COLLECTIONS.doctorSchedules, scheduleSeeds),
    ...fromSeeds(COLLECTIONS.doctorServicePrices, doctorPriceSeeds),
    ...fromSeeds(COLLECTIONS.serviceCategories, categorySeeds),
    ...fromSeeds(COLLECTIONS.services, serviceSeeds),
    ...fromSeeds(COLLECTIONS.labUnits, labUnitSeeds),

    singleton(COLLECTIONS.founder, "profile", { ...founderSeed }),
    singleton(COLLECTIONS.clinicSettings, "site", { ...siteSettingsSeed }),
    singleton(COLLECTIONS.paymentMethods, "default", { ...paymentMethodsSeed }),
    singleton(COLLECTIONS.socialLinks, "default", { ...socialLinksSeed }),
    singleton(COLLECTIONS.siteContent, "labProfile", { ...labProfileSeed }),
    singleton(COLLECTIONS.siteContent, "store", { ...storeContentSeed }),

    ...homepageSectionSeeds.map((section) =>
      singleton(COLLECTIONS.homepageSections, section.key, {
        enabled: section.enabled,
        sortOrder: section.sortOrder,
      }),
    ),
  ];

  const countsByCollection: Record<string, number> = {};
  for (const write of writes) {
    countsByCollection[write.collection] =
      (countsByCollection[write.collection] ?? 0) + 1;
  }

  return { writes, countsByCollection };
}
