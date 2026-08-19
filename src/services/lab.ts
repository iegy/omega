import { query, where, type Query } from "firebase/firestore/lite";

import { COLLECTIONS } from "@/config/constants";
import {
  labServicesCollection,
  labUnitsCollection,
  sampleCollectionRequestsCollection,
  singletonDoc,
  SINGLETON_IDS,
} from "@/firebase/collections";
import { normalizeLabProfile } from "@/firebase/normalizers";
import type {
  LabProfile,
  LabService,
  LabUnit,
  SampleCollectionRequest,
  SampleRequestStatus,
} from "@/types/lab";

import { cache } from "react";

import { safeGetRaw, safeList } from "./firestore-access";
import { readPublicCacheGroup } from "./public-cache";
import { sortByOrderThenName } from "./repository-helpers";

/**
 * Mawada Atef Lab.
 *
 * The laboratory profile is a single document (`siteContent/labProfile`) so the
 * whole page — name, logo, numbers, hours, sample-collection copy — is editable
 * from Admin → Lab without schema churn (spec BA).
 */
export async function getLabProfile(): Promise<LabProfile | null> {
  const data = await safeGetRaw(
    singletonDoc(COLLECTIONS.siteContent, SINGLETON_IDS.labProfile),
    { context: "getLabProfile" },
  );
  return data ? normalizeLabProfile(data) : null;
}

export async function listLabUnits(): Promise<LabUnit[]> {
  const collectionRef = labUnitsCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("active", "==", true)) : null,
    { context: "listLabUnits" },
  );
  return sortByOrderThenName(records);
}

export async function listAllLabUnits(): Promise<LabUnit[]> {
  const records = await safeList(labUnitsCollection(), { context: "listAllLabUnits" });
  return sortByOrderThenName(records);
}

export async function listLabServices(unitId?: string): Promise<LabService[]> {
  const collectionRef = labServicesCollection();

  let target: Query<LabService> | null = null;
  if (collectionRef) {
    target = unitId
      ? query(collectionRef, where("active", "==", true), where("unitId", "==", unitId))
      : query(collectionRef, where("active", "==", true));
  }

  const records = await safeList(target, {
    context: `listLabServices(${unitId ?? "all"})`,
  });
  return sortByOrderThenName(records);
}

/* -------------------------------------------------------------------------- */
/*  Sample collection requests (spec Y)                                        */
/* -------------------------------------------------------------------------- */

/**
 * Staff-only. These documents hold patient contact details, so
 * `firestore.rules` blocks every public read; an unauthorised caller receives an
 * empty list rather than an error page.
 *
 * Creation from the public lab page is implemented in Phase 7.
 */
export async function listSampleCollectionRequests(
  status?: SampleRequestStatus,
): Promise<SampleCollectionRequest[]> {
  const collectionRef = sampleCollectionRequestsCollection();

  let target: Query<SampleCollectionRequest> | null = collectionRef;
  if (collectionRef && status) {
    target = query(collectionRef, where("status", "==", status));
  }

  const records = await safeList(target, {
    context: `listSampleCollectionRequests(${status ?? "all"})`,
  });

  // Newest first — `createdAt` is an ISO string, so lexical compare is correct.
  return [...records].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

/* -------------------------------------------------------------------------- */
/*  Public "lab" cache group                                                   */
/* -------------------------------------------------------------------------- */

export interface PublicLabDataset {
  profile: LabProfile | null;
  units: LabUnit[];
}

/**
 * The public laboratory data: the profile document plus its active units.
 *
 * Shared by `/labs` and the homepage lab section. `sampleCollectionRequests` is
 * emphatically **not** here — it holds patient contact details, is staff-only in
 * `firestore.rules`, and must never enter a public cache.
 */
export const getPublicLabDataset = cache(
  async (): Promise<PublicLabDataset> =>
    readPublicCacheGroup("lab", async () => {
      const [profile, units] = await Promise.all([getLabProfile(), listLabUnits()]);
      return { profile, units };
    }),
);
