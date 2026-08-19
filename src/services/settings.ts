import { cache } from "react";

import { COLLECTIONS } from "@/config/constants";
import { defaultSiteSettings } from "@/config/default-settings";
import { rawCollection, singletonDoc, SINGLETON_IDS } from "@/firebase/collections";
import { deepNormalizeTimestamps } from "@/firebase/converters";
import { normalizeHomepageSection } from "@/firebase/normalizers";
import { deepMergeSettings } from "@/lib/deep-merge";
import {
  HOMEPAGE_SECTION_KEYS,
  type HomepageSection,
  type SiteSettings,
} from "@/types/site";

import { safeGetRaw, safeListWithIds } from "./firestore-access";
import { readPublicCacheGroup } from "./public-cache";

/**
 * Single entry point for the editable site configuration.
 *
 * Resolution order (spec 15 / 16):
 *   1. `clinicSettings/site` in Firestore, when it exists and is readable.
 *   2. Deep-merged over `defaultSiteSettings` so a partially filled document
 *      still renders every section.
 *   3. The Phase 1 fallback alone when Firebase is unconfigured, offline,
 *      permission-denied, or the document has not been seeded yet.
 *
 * The public website therefore keeps working before Phase 3 seeding, and a
 * Firestore outage degrades to the last-known-good defaults instead of an error
 * page. Reads are memoised per request with React `cache()`, so the header,
 * footer, hero and metadata of one page share a single Firestore round-trip.
 */
const loadSiteSettings = async (): Promise<SiteSettings> => {
  const [raw, payments, social] = await Promise.all([
    safeGetRaw(singletonDoc(COLLECTIONS.clinicSettings, SINGLETON_IDS.siteSettings), {
      context: "getSiteSettings",
    }),
    safeGetRaw(singletonDoc(COLLECTIONS.paymentMethods, SINGLETON_IDS.config), {
      context: "getPaymentMethods",
    }),
    safeGetRaw(singletonDoc(COLLECTIONS.socialLinks, SINGLETON_IDS.config), {
      context: "getSocialLinks",
    }),
  ]);

  if (!raw && !payments && !social) return defaultSiteSettings;

  // `payments` and `socialLinks` live in their own collections so the strict
  // super-admin-only write rule on payment numbers is expressed at the
  // collection level. They are merged back into one settings object here, which
  // keeps a single source of truth per concern and one shape for the UI.
  const normalized = {
    ...(deepNormalizeTimestamps(raw ?? {}) as Record<string, unknown>),
    ...(payments ? { payments: deepNormalizeTimestamps(payments) } : {}),
    ...(social ? { social: deepNormalizeTimestamps(social) } : {}),
  };

  const merged = deepMergeSettings(
    defaultSiteSettings as unknown as Record<string, unknown>,
    normalized,
  ) as unknown as SiteSettings;

  // `homepageSections` has its own collection; the settings document must not
  // be able to override it with a stale copy.
  return { ...merged, homepageSections: defaultSiteSettings.homepageSections };
};

/* -------------------------------------------------------------------------- */
/*  Homepage sections (spec 17 / BR)                                           */
/* -------------------------------------------------------------------------- */

/**
 * `homepageSections/{key}` — document ID is the section key, fields are
 * `enabled` and `sortOrder`.
 *
 * Any section missing from Firestore keeps its Phase 1 default, so seeding a
 * single document cannot accidentally blank the homepage.
 */
const loadHomepageSectionConfig = async (): Promise<HomepageSection[]> => {
  const documents = await safeListWithIds(rawCollection(COLLECTIONS.homepageSections), {
    context: "getHomepageSectionConfig",
  });

  if (documents.length === 0) return defaultSiteSettings.homepageSections;

  const overrides = new Map<string, HomepageSection>();
  for (const { id, data } of documents) {
    // The document ID is the section key; unknown keys are ignored.
    const section = normalizeHomepageSection(id, data);
    if (section) overrides.set(section.key, section);
  }

  return HOMEPAGE_SECTION_KEYS.map((key) => {
    const fallback = defaultSiteSettings.homepageSections.find(
      (section) => section.key === key,
    );
    return (
      overrides.get(key) ?? fallback ?? { key, enabled: true, sortOrder: 100 }
    );
  });
};

/* -------------------------------------------------------------------------- */
/*  Public "settings" cache group                                              */
/* -------------------------------------------------------------------------- */

interface PublicSettingsDataset {
  settings: SiteSettings;
  sections: HomepageSection[];
}

/**
 * The whole public configuration in one cached payload.
 *
 * Settings and the homepage section list are always needed together — the
 * layout, header, footer and every page's metadata read the settings, and the
 * homepage reads the sections — so they share one cache entry and one edge
 * lookup instead of two.
 *
 * `cache()` dedupes within a single render; `readPublicCacheGroup()` dedupes
 * across requests for 30 minutes.
 */
const getPublicSettingsDataset = cache(async (): Promise<PublicSettingsDataset> =>
  readPublicCacheGroup("settings", async () => {
    const [settings, sections] = await Promise.all([
      loadSiteSettings(),
      loadHomepageSectionConfig(),
    ]);
    return { settings, sections };
  }),
);

/**
 * Editable site configuration for the **public** website — served from the edge
 * cache when warm.
 *
 * The Admin Dashboard must not read a cached copy of the values it is editing,
 * so it uses `getSiteSettingsFresh()` instead.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const { settings } = await getPublicSettingsDataset();
  return settings;
}

/**
 * Uncached settings, straight from Firestore.
 *
 * For the Admin Dashboard: an editor has to see what they just saved, not a
 * value that is up to 30 minutes old.
 */
export const getSiteSettingsFresh = cache(loadSiteSettings);

export async function getHomepageSectionConfig(): Promise<HomepageSection[]> {
  const { sections } = await getPublicSettingsDataset();
  return sections;
}

/** Uncached homepage section config, for the Admin Dashboard. */
export const getHomepageSectionConfigFresh = cache(loadHomepageSectionConfig);

/** Enabled homepage sections in the admin-defined order (spec I / BR). */
export async function getHomepageSections(): Promise<HomepageSection[]> {
  const sections = await getHomepageSectionConfig();
  return sections
    .filter((section) => section.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
