import type { DocumentMeta, MoneyEgp, SeoFields } from "./common";

/* -------------------------------------------------------------------------- */
/*  Specialty (spec R / AY)                                                    */
/* -------------------------------------------------------------------------- */

export interface Specialty extends DocumentMeta, SeoFields {
  nameAr: string;
  nameEn: string;
  slug: string;

  descriptionAr: string | null;
  descriptionEn: string | null;

  /** Lucide icon name, resolved through an allow-list in the UI. */
  icon: string | null;
  imageUrl: string | null;
  imageDeleteUrl: string | null;

  active: boolean;
  featured: boolean;
  sortOrder: number;
}

/* -------------------------------------------------------------------------- */
/*  Service category (spec AZ)                                                 */
/* -------------------------------------------------------------------------- */

export interface ServiceCategory extends DocumentMeta {
  nameAr: string;
  nameEn: string;
  slug: string;

  descriptionAr: string | null;
  descriptionEn: string | null;

  /**
   * Groups the catalogue into the public sections:
   * medical services, diagnostics, aesthetics & laser, weight management, lab…
   */
  active: boolean;
  sortOrder: number;
}

/* -------------------------------------------------------------------------- */
/*  Service (spec S / T / U)                                                   */
/* -------------------------------------------------------------------------- */

export interface Service extends DocumentMeta, SeoFields {
  nameAr: string;
  nameEn: string;
  slug: string;

  descriptionAr: string | null;
  descriptionEn: string | null;

  categoryId: string | null;

  imageUrl: string | null;
  imageDeleteUrl: string | null;

  /** `null` until the clinic supplies a price (spec AN). */
  price: MoneyEgp | null;
  showPrice: boolean;

  active: boolean;
  featured: boolean;

  /** Diagnostics and procedures are bookable; informational entries are not. */
  requiresBooking: boolean;

  /** Doctors who provide this service. */
  doctorIds: string[];
  /** Specialties this service belongs to, for cross-linking. */
  specialtyIds: string[];

  sortOrder: number;
}

/* -------------------------------------------------------------------------- */
/*  Offers (spec AL / AM)                                                      */
/* -------------------------------------------------------------------------- */

export const DISCOUNT_TYPES = ["percentage", "fixed", "special_price"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const OFFER_TARGET_TYPES = [
  "doctor",
  "service",
  "specialty",
  "lab",
  "aesthetics",
] as const;
export type OfferTargetType = (typeof OFFER_TARGET_TYPES)[number];

export interface Offer extends DocumentMeta {
  titleAr: string;
  titleEn: string;

  descriptionAr: string | null;
  descriptionEn: string | null;

  imageUrl: string | null;
  imageDeleteUrl: string | null;

  discountType: DiscountType;
  /** Percentage (0–100), fixed EGP amount, or the special price itself. */
  discountValue: MoneyEgp | null;

  originalPrice: MoneyEgp | null;
  offerPrice: MoneyEgp | null;

  /** ISO dates; the offer is only valid inside this window (spec AM). */
  startDate: string | null;
  endDate: string | null;

  active: boolean;
  featured: boolean;
  showOnHome: boolean;

  appliesTo: OfferTargetType;
  /** IDs inside `appliesTo`; empty means "the whole area". */
  targetIds: string[];

  sortOrder: number;
}

/* -------------------------------------------------------------------------- */
/*  Testimonials (spec BQ — architecture only, never seeded with fakes)        */
/* -------------------------------------------------------------------------- */

export interface Testimonial extends DocumentMeta {
  patientName: string | null;
  bodyAr: string | null;
  bodyEn: string | null;
  /** 1–5, or `null` when the clinic recorded a quote without a rating. */
  rating: number | null;
  doctorId: string | null;
  serviceId: string | null;
  /** Only published, clinic-verified testimonials are ever rendered. */
  published: boolean;
  sortOrder: number;
}
