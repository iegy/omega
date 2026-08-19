/** Non-business constants. Anything that the clinic may want to change lives in Firestore. */

export const TIMEZONE = "Africa/Cairo";

export const CURRENCY_CODE = "EGP";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

/** Firestore collection names, kept in one place (used from Phase 2 onwards). */
export const COLLECTIONS = {
  doctors: "doctors",
  doctorServicePrices: "doctorServicePrices",
  doctorSchedules: "doctorSchedules",
  scheduleExceptions: "scheduleExceptions",
  specialties: "specialties",
  appointments: "appointments",
  services: "services",
  serviceCategories: "serviceCategories",
  offers: "offers",
  labUnits: "labUnits",
  labServices: "labServices",
  sampleCollectionRequests: "sampleCollectionRequests",
  founder: "founder",
  clinicSettings: "clinicSettings",
  paymentMethods: "paymentMethods",
  socialLinks: "socialLinks",
  siteContent: "siteContent",
  homepageSections: "homepageSections",
  testimonials: "testimonials",
  admins: "admins",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
