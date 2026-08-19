import type { SeoFields } from "./common";

/** One academic / professional qualification (spec AP — dates are never invented). */
export interface FounderQualification {
  id: string;
  titleAr: string;
  titleEn: string;
  /** Awarding institution, e.g. "IBAS — Switzerland". */
  institutionAr: string | null;
  institutionEn: string | null;
  /** Only filled if the clinic supplies it. */
  year: string | null;
  sortOrder: number;
}

/** Optional milestone list for the founder page timeline (spec AO). */
export interface FounderTimelineEntry {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  year: string | null;
  sortOrder: number;
}

/**
 * Single document: `founder/profile`.
 * Everything on `/founder` and the homepage teaser is editable from
 * Admin → Founder (spec AQ).
 */
export interface Founder extends SeoFields {
  nameAr: string;
  nameEn: string;

  titleAr: string | null;
  titleEn: string | null;

  bioAr: string | null;
  bioEn: string | null;

  visionAr: string | null;
  visionEn: string | null;

  messageAr: string | null;
  messageEn: string | null;

  imageUrl: string | null;
  imageDeleteUrl: string | null;

  qualifications: FounderQualification[];
  timeline: FounderTimelineEntry[];

  /** Controls both the dedicated page and the homepage preview section. */
  active: boolean;
  showOnHomepage: boolean;
}
