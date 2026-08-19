import type { DocumentMeta, IsoDate, MoneyEgp, SeoFields, TimeOfDay } from "./common";

/* -------------------------------------------------------------------------- */
/*  Mawada Atef Lab units (spec X)                                             */
/* -------------------------------------------------------------------------- */

export interface LabUnit extends DocumentMeta {
  nameAr: string;
  nameEn: string;
  slug: string;

  descriptionAr: string | null;
  descriptionEn: string | null;

  icon: string | null;
  imageUrl: string | null;
  imageDeleteUrl: string | null;

  active: boolean;
  sortOrder: number;
}

/** Individual test offered by the laboratory. */
export interface LabService extends DocumentMeta {
  unitId: string | null;

  nameAr: string;
  nameEn: string;
  slug: string;

  descriptionAr: string | null;
  descriptionEn: string | null;

  /** `null` until the laboratory supplies a price. */
  price: MoneyEgp | null;
  showPrice: boolean;

  /** e.g. "صائم 8 ساعات" — preparation notes for the patient. */
  preparationAr: string | null;
  preparationEn: string | null;

  /** Expected turnaround, free text in both languages. */
  turnaroundAr: string | null;
  turnaroundEn: string | null;

  active: boolean;
  featured: boolean;
  sortOrder: number;
}

/* -------------------------------------------------------------------------- */
/*  Laboratory profile (single document, spec BA)                              */
/* -------------------------------------------------------------------------- */

export interface LabProfile extends SeoFields {
  nameAr: string;
  nameEn: string;

  descriptionAr: string | null;
  descriptionEn: string | null;

  logoUrl: string | null;
  logoDeleteUrl: string | null;

  /** The laboratory's own numbers; Omega Care numbers stay in clinicSettings. */
  phones: string[];
  whatsapp: string | null;

  openingHoursAr: string | null;
  openingHoursEn: string | null;

  sampleCollectionEnabled: boolean;
  sampleCollectionNoteAr: string | null;
  sampleCollectionNoteEn: string | null;

  active: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Sample collection requests (spec Y)                                        */
/* -------------------------------------------------------------------------- */

export const SAMPLE_LOCATION_TYPES = ["home", "hospital", "clinic"] as const;
export type SampleLocationType = (typeof SAMPLE_LOCATION_TYPES)[number];

export const SAMPLE_REQUEST_STATUSES = [
  "new",
  "contacted",
  "scheduled",
  "completed",
  "cancelled",
] as const;
export type SampleRequestStatus = (typeof SAMPLE_REQUEST_STATUSES)[number];

/**
 * Created by anonymous visitors from the lab page (Phase 7).
 * Contains patient contact data, so it is never publicly readable — only
 * authorised staff can list or read these documents (see `firestore.rules`).
 */
export interface SampleCollectionRequest extends DocumentMeta {
  fullName: string;
  phone: string;

  locationType: SampleLocationType;
  address: string;
  area: string | null;

  /** Requested date + rough time window, both optional. */
  preferredDate: IsoDate | null;
  preferredTime: TimeOfDay | null;

  notes: string | null;

  status: SampleRequestStatus;
  /** Internal staff notes, never shown to the patient. */
  adminNotes: string | null;
  handledByUid: string | null;
}
