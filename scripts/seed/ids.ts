/**
 * Deterministic document IDs.
 *
 * Every seed record has a stable, human-readable ID derived from its slug, so
 * re-running the seed updates the same document instead of creating a duplicate
 * (spec 1 / 31). Auto-IDs are never used for seeded data.
 *
 * Convention
 * ----------
 *   doctors/doctor-<doctor-slug>
 *   doctorSchedules/schedule-<doctor-slug>-<dayName>-<HHmm>
 *   doctorServicePrices/price-<doctor-slug>-<item-slug>
 *   specialties/specialty-<specialty-slug>
 *   serviceCategories/category-<category-slug>
 *   services/service-<service-slug>
 *   labUnits/lab-unit-<unit-slug>
 *   founder/profile
 *   clinicSettings/site · paymentMethods/default · socialLinks/default
 *   siteContent/labProfile · siteContent/store
 *   homepageSections/<sectionKey>
 *
 * The `slug` field always equals the ID minus its prefix, which keeps public
 * URLs (`/doctors/<slug>`) readable and stable.
 */

export const DAY_NAMES = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
] as const;

export function doctorId(slug: string): string {
  return `doctor-${slug}`;
}

export function scheduleId(
  doctorSlug: string,
  dayOfWeek: number,
  startTime: string,
): string {
  return `schedule-${doctorSlug}-${DAY_NAMES[dayOfWeek]}-${startTime.replace(":", "")}`;
}

export function priceId(doctorSlug: string, itemSlug: string): string {
  return `price-${doctorSlug}-${itemSlug}`;
}

export function specialtyId(slug: string): string {
  return `specialty-${slug}`;
}

export function categoryId(slug: string): string {
  return `category-${slug}`;
}

export function serviceId(slug: string): string {
  return `service-${slug}`;
}

export function labUnitId(slug: string): string {
  return `lab-unit-${slug}`;
}
