import type messages from "@/messages/ar.json";

/**
 * Message-key unions derived from the Arabic dictionary (the source of truth).
 * Using these instead of `string` means a renamed or missing key fails the
 * build instead of rendering a raw key to a patient.
 */
export type Messages = typeof messages;

export type CommonKey = keyof Messages["common"];
export type NavKey = keyof Messages["nav"];
export type CtaKey = keyof Messages["cta"];
export type AdminNavKey = keyof Messages["admin"]["nav"];
export type PagesNamespace = keyof Messages["pages"];
export type QuickActionKey = Exclude<keyof Messages["home"]["quickActions"], "title">;
export type WhyUsItemKey = keyof Messages["home"]["whyUs"]["items"];

/** Empty-state keys for the homepage collection blocks. */
export type HomeSectionEmptyKey = keyof Messages["homeSections"];

/** Homepage blocks that render a `title` + `subtitle` heading over remote data. */
export type HomeDataNamespace =
  | "doctorsToday"
  | "specialties"
  | "featuredDoctors"
  | "services"
  | "offers"
  | "testimonials";
