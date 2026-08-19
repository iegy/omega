import type { Bilingual } from "./common";

/**
 * `Bilingual` / `pickLocale` moved to `./common` in Phase 2 so that both the
 * settings tree and the Firestore document models can share them.
 * Re-exported here to keep existing import paths valid.
 */
export type { Bilingual, BilingualNullable, DocumentMeta, IsoDateTime } from "./common";
export { pickLocale } from "./common";

/* -------------------------------------------------------------------------- */
/*  Homepage sections                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Every homepage block is addressable by a stable key so the admin dashboard
 * can toggle `enabled` and change `sortOrder` (spec I) without a code deploy.
 */
export const HOMEPAGE_SECTION_KEYS = [
  "hero",
  "quickActions",
  "doctorsToday",
  "specialties",
  "featuredDoctors",
  "services",
  "offers",
  "lab",
  "aesthetics",
  "whyUs",
  "founderPreview",
  "testimonials",
  "location",
  "bookingCta",
] as const;

export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export interface HomepageSection {
  key: HomepageSectionKey;
  enabled: boolean;
  sortOrder: number;
}

/* -------------------------------------------------------------------------- */
/*  Clinic settings                                                            */
/* -------------------------------------------------------------------------- */

export interface PaymentMethodSettings {
  cashEnabled: boolean;
  walletEnabled: boolean;
  instapayEnabled: boolean;
  /** Mobile-wallet number that patients transfer to. */
  walletNumber: string | null;
  /** InstaPay address / number. */
  instapayNumber: string | null;
  instructions: Bilingual | null;
}

export interface SocialLinks {
  facebook: string | null;
  tiktok: string | null;
  instagram: string | null;
  youtube: string | null;
}

export interface ContactSettings {
  phone: string | null;
  secondaryPhone: string | null;
  whatsapp: string | null;
  labPhones: string[];
  email: string | null;
}

export interface LocationSettings {
  address: Bilingual;
  latitude: number | null;
  longitude: number | null;
  mapsUrl: string | null;
  directionsUrl: string | null;
}

export interface BrandingSettings {
  clinicName: Bilingual;
  tagline: Bilingual;
  logoUrl: string | null;
  /** Icon-only mark, used where the full lock-up would be illegible (header). */
  logoMarkUrl: string | null;
  logoMonoUrl: string | null;
  labLogoUrl: string | null;
  faviconUrl: string | null;
}

export interface SeoDefaults {
  title: Bilingual;
  description: Bilingual;
  keywords: Bilingual;
  ogImageUrl: string | null;
}

export interface HeroContent {
  title: Bilingual;
  subtitle: Bilingual;
  primaryCtaLabel: Bilingual;
  primaryCtaHref: string;
  secondaryCtaLabel: Bilingual;
  secondaryCtaHref: string;
  imageUrl: string | null;
}

export interface FooterContent {
  about: Bilingual;
  copyright: Bilingual;
}

/**
 * The full editable configuration of the public site.
 * Phase 1 serves this from `src/config/default-settings.ts`;
 * from Phase 2 it is loaded from Firestore (`clinicSettings/site`)
 * with the same shape and the local file only used as a fallback.
 */
export interface SiteSettings {
  branding: BrandingSettings;
  contact: ContactSettings;
  location: LocationSettings;
  social: SocialLinks;
  payments: PaymentMethodSettings;
  hero: HeroContent;
  footer: FooterContent;
  seo: SeoDefaults;
  homepageSections: HomepageSection[];
  /** ISO date of the last admin backup, surfaced as a dashboard reminder. */
  lastBackupAt: string | null;
}
