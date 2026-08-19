import { cache } from "react";

import { isSchedulePublishable } from "@/types/doctor";
import type { Doctor, DoctorSchedule, DoctorServicePrice } from "@/types/doctor";
import type { Service, ServiceCategory, Specialty } from "@/types/catalog";

import { getPublicCatalogDataset } from "./catalog";
import { getPublicDoctorsDataset } from "./doctors";
import { clinicWeekday } from "./repository-helpers";

/**
 * Aggregate read models for the public site.
 *
 * Why this layer exists: pages such as `/doctors` need each doctor's
 * specialties, working periods and prices together. Fetching those per doctor
 * would be 17 × 3 queries. Every loader here instead reads one of the cached
 * **public cache groups** (`services/public-cache.ts`) and joins in memory.
 *
 * That gives three levels of reuse, cheapest first:
 *   1. Cloudflare Cache API — 30 minutes, shared across requests, locales and
 *      routes. A warm group costs zero Firestore reads.
 *   2. React `cache()` — one render pass.
 *   3. The build-process memo (`services/build-cache.ts`) — one `next build`.
 *
 * Nothing is invented. A doctor with no schedules gets an empty array, a price
 * of `null` stays `null`, and `bookingMode: null` keeps a period unbookable.
 */

/* -------------------------------------------------------------------------- */
/*  Doctors directory                                                          */
/* -------------------------------------------------------------------------- */

/** A doctor joined with everything the public UI needs to render them. */
export interface DoctorListing {
  doctor: Doctor;
  specialties: Specialty[];
  schedules: DoctorSchedule[];
  /** Publicly displayable rows that carry an actual amount. */
  prices: DoctorServicePrice[];
  /**
   * Rows the doctor genuinely offers whose price the clinic has not published.
   * Shown as a plain service list so the patient still learns the service
   * exists — the amount is confirmed at reception, never guessed.
   */
  unpricedServices: DoctorServicePrice[];
  /** The consultation row, when one exists, for the "from …" price line. */
  consultation: DoctorServicePrice | null;
  /** `true` only when at least one period is genuinely bookable online. */
  onlineBookingAvailable: boolean;
}

export interface DoctorsDirectory {
  listings: DoctorListing[];
  specialties: Specialty[];
  /** Specialties that actually have at least one active doctor. */
  usedSpecialties: Specialty[];
}

/**
 * A row is shown on public pages only when the doctor's master switch and the
 * row's own switch both allow it. The booking flow (Phase 6) shows the amount
 * due regardless of these flags (spec Q).
 */
function visibleRows(
  doctor: Doctor,
  prices: DoctorServicePrice[],
): DoctorServicePrice[] {
  if (!doctor.showPricePublicly) return [];
  return prices.filter((price) => price.showPricePublicly);
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const bucket = map.get(key(item));
    if (bucket) bucket.push(item);
    else map.set(key(item), [item]);
  }
  return map;
}

function sortSchedules(schedules: DoctorSchedule[]): DoctorSchedule[] {
  return [...schedules].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
  );
}

export const getDoctorsDirectory = cache(async (): Promise<DoctorsDirectory> => {
  const { doctors, specialties, schedules, prices } = await getPublicDoctorsDataset();

  const specialtyById = new Map(specialties.map((specialty) => [specialty.id, specialty]));
  const schedulesByDoctor = groupBy(schedules, (schedule) => schedule.doctorId);
  const pricesByDoctor = groupBy(prices, (price) => price.doctorId);

  const listings = doctors.map<DoctorListing>((doctor) => {
    const doctorSchedules = sortSchedules(schedulesByDoctor.get(doctor.id) ?? []);
    const doctorPrices = pricesByDoctor.get(doctor.id) ?? [];
    const shown = visibleRows(doctor, doctorPrices);
    const priced = shown.filter((price) => price.price !== null);

    return {
      doctor,
      specialties: doctor.specialtyIds
        .map((id) => specialtyById.get(id))
        .filter((specialty): specialty is Specialty => specialty !== undefined),
      schedules: doctorSchedules,
      prices: priced,
      unpricedServices: shown.filter((price) => price.price === null),
      consultation:
        priced.find((price) => price.kind === "consultation") ?? priced[0] ?? null,
      onlineBookingAvailable: doctorSchedules.some(isSchedulePublishable),
    };
  });

  const usedSpecialtyIds = new Set(doctors.flatMap((doctor) => doctor.specialtyIds));

  return {
    listings,
    specialties,
    usedSpecialties: specialties.filter((specialty) =>
      usedSpecialtyIds.has(specialty.id),
    ),
  };
});

/** One doctor with the same joined shape, or `null` when the slug is unknown. */
export async function getDoctorListing(slug: string): Promise<DoctorListing | null> {
  const { listings } = await getDoctorsDirectory();
  return listings.find((listing) => listing.doctor.slug === slug) ?? null;
}

/**
 * Doctors whose weekly schedule includes today (clinic timezone).
 *
 * This reflects the *published* weekly pattern. Same-day exceptions
 * (`scheduleExceptions`) are applied by the booking engine in Phase 6; showing
 * the recurring pattern here matches what the clinic advertises today.
 */
export const getDoctorsToday = cache(
  async (): Promise<{ listing: DoctorListing; today: DoctorSchedule[] }[]> => {
    const { listings } = await getDoctorsDirectory();
    const weekday = clinicWeekday();

    return listings
      .map((listing) => ({
        listing,
        today: listing.schedules.filter((schedule) => schedule.dayOfWeek === weekday),
      }))
      .filter((entry) => entry.today.length > 0);
  },
);

/* -------------------------------------------------------------------------- */
/*  Specialties                                                               */
/* -------------------------------------------------------------------------- */

export interface SpecialtyListing {
  specialty: Specialty;
  doctors: Doctor[];
  services: Service[];
}

export const getSpecialtiesDirectory = cache(
  async (): Promise<SpecialtyListing[]> => {
    const [{ doctors, specialties }, { services }] = await Promise.all([
      getPublicDoctorsDataset(),
      getPublicCatalogDataset(),
    ]);

    return specialties.map((specialty) => ({
      specialty,
      doctors: doctors.filter((doctor) => doctor.specialtyIds.includes(specialty.id)),
      services: services.filter((service) =>
        service.specialtyIds.includes(specialty.id),
      ),
    }));
  },
);

export async function getSpecialtyListing(
  slug: string,
): Promise<SpecialtyListing | null> {
  const directory = await getSpecialtiesDirectory();
  return directory.find((entry) => entry.specialty.slug === slug) ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Services                                                                  */
/* -------------------------------------------------------------------------- */

export interface ServiceGroup {
  category: ServiceCategory;
  services: Service[];
}

export interface ServicesCatalogue {
  /** Only categories that actually contain at least one active service. */
  groups: ServiceGroup[];
  /** Active services whose `categoryId` is missing or points nowhere. */
  uncategorized: Service[];
  services: Service[];
}

export const getServicesCatalogue = cache(async (): Promise<ServicesCatalogue> => {
  const { services, categories } = await getPublicCatalogDataset();

  const categoryIds = new Set(categories.map((category) => category.id));

  const groups = categories
    .map<ServiceGroup>((category) => ({
      category,
      services: services.filter((service) => service.categoryId === category.id),
    }))
    // A category with no services is hidden rather than shown empty: the clinic
    // has categories reserved for later (e.g. laboratory), and an empty heading
    // reads like a broken page.
    .filter((group) => group.services.length > 0);

  return {
    groups,
    uncategorized: services.filter(
      (service) => service.categoryId === null || !categoryIds.has(service.categoryId),
    ),
    services,
  };
});

export interface ServiceListing {
  service: Service;
  category: ServiceCategory | null;
  doctors: Doctor[];
  specialties: Specialty[];
  /** Doctor-specific prices for this service — never the catalogue price. */
  doctorPrices: { doctor: Doctor; price: DoctorServicePrice }[];
  related: Service[];
}

export async function getServiceListing(slug: string): Promise<ServiceListing | null> {
  const [catalogue, { categories }, directory] = await Promise.all([
    getServicesCatalogue(),
    getPublicCatalogDataset(),
    getDoctorsDirectory(),
  ]);

  const service = catalogue.services.find((entry) => entry.slug === slug);
  if (!service) return null;

  const doctorById = new Map(
    directory.listings.map((listing) => [listing.doctor.id, listing.doctor]),
  );
  const specialtyById = new Map(
    directory.specialties.map((specialty) => [specialty.id, specialty]),
  );

  /**
   * Doctor pricing is only reported when the doctor's own priced row explicitly
   * references this service (`serviceId`). The catalogue price and a doctor's
   * price are different figures; inferring one from the other would put a
   * number on the page that the clinic never quoted.
   */
  const doctorPrices = directory.listings.flatMap((listing) =>
    listing.prices
      .filter((price) => price.serviceId === service.id)
      .map((price) => ({ doctor: listing.doctor, price })),
  );

  return {
    service,
    category:
      categories.find((category) => category.id === service.categoryId) ?? null,
    doctors: service.doctorIds
      .map((id) => doctorById.get(id))
      .filter((doctor): doctor is Doctor => doctor !== undefined),
    specialties: service.specialtyIds
      .map((id) => specialtyById.get(id))
      .filter((specialty): specialty is Specialty => specialty !== undefined),
    doctorPrices,
    related: catalogue.services
      .filter(
        (entry) =>
          entry.id !== service.id &&
          service.categoryId !== null &&
          entry.categoryId === service.categoryId,
      )
      .slice(0, 6),
  };
}

/** Services in the aesthetics & laser category, for `/aesthetics`. */
export const AESTHETICS_CATEGORY_SLUG = "aesthetics";

export const getAestheticsCatalogue = cache(
  async (): Promise<ServiceGroup | null> => {
    const catalogue = await getServicesCatalogue();
    return (
      catalogue.groups.find(
        (group) => group.category.slug === AESTHETICS_CATEGORY_SLUG,
      ) ?? null
    );
  },
);
