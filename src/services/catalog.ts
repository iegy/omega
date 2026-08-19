import { query, where } from "firebase/firestore/lite";

import {
  offersCollection,
  serviceCategoriesCollection,
  servicesCollection,
  specialtiesCollection,
  testimonialsCollection,
} from "@/firebase/collections";
import type {
  Offer,
  Service,
  ServiceCategory,
  Specialty,
  Testimonial,
} from "@/types/catalog";

import { cache } from "react";

import { safeList } from "./firestore-access";
import { readPublicCacheGroup } from "./public-cache";
import { clinicToday, sortByOrderThenName, sortRecords } from "./repository-helpers";

/* -------------------------------------------------------------------------- */
/*  Specialties                                                                */
/* -------------------------------------------------------------------------- */

export async function listPublicSpecialties(): Promise<Specialty[]> {
  const collectionRef = specialtiesCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("active", "==", true)) : null,
    { context: "listPublicSpecialties" },
  );
  return sortByOrderThenName(records);
}

export async function listAllSpecialties(): Promise<Specialty[]> {
  const records = await safeList(specialtiesCollection(), {
    context: "listAllSpecialties",
  });
  return sortByOrderThenName(records);
}

export async function getSpecialtyBySlug(slug: string): Promise<Specialty | null> {
  const collectionRef = specialtiesCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("slug", "==", slug)) : null,
    { context: `getSpecialtyBySlug(${slug})` },
  );
  return records[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Service categories + services                                              */
/* -------------------------------------------------------------------------- */

export async function listServiceCategories(): Promise<ServiceCategory[]> {
  const collectionRef = serviceCategoriesCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("active", "==", true)) : null,
    { context: "listServiceCategories" },
  );
  return sortByOrderThenName(records);
}

export async function listPublicServices(): Promise<Service[]> {
  const collectionRef = servicesCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("active", "==", true)) : null,
    { context: "listPublicServices" },
  );
  return sortByOrderThenName(records);
}

export async function listAllServices(): Promise<Service[]> {
  const records = await safeList(servicesCollection(), { context: "listAllServices" });
  return sortByOrderThenName(records);
}

export async function listServicesByCategory(categoryId: string): Promise<Service[]> {
  const collectionRef = servicesCollection();
  const records = await safeList(
    collectionRef
      ? query(
          collectionRef,
          where("active", "==", true),
          where("categoryId", "==", categoryId),
        )
      : null,
    { context: `listServicesByCategory(${categoryId})` },
  );
  return sortByOrderThenName(records);
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const collectionRef = servicesCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("slug", "==", slug)) : null,
    { context: `getServiceBySlug(${slug})` },
  );
  return records[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Offers (spec AL / AM)                                                      */
/* -------------------------------------------------------------------------- */

/** `true` when the offer is active *and* inside its date window. */
export function isOfferLive(offer: Offer, isoToday = clinicToday()): boolean {
  if (!offer.active) return false;
  if (offer.startDate && isoToday < offer.startDate) return false;
  if (offer.endDate && isoToday > offer.endDate) return false;
  return true;
}

export async function listLiveOffers(): Promise<Offer[]> {
  const collectionRef = offersCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("active", "==", true)) : null,
    { context: "listLiveOffers" },
  );
  const today = clinicToday();
  return sortRecords(records.filter((offer) => isOfferLive(offer, today)));
}

export async function listHomepageOffers(): Promise<Offer[]> {
  const offers = await listLiveOffers();
  return offers.filter((offer) => offer.showOnHome);
}

export async function listAllOffers(): Promise<Offer[]> {
  const records = await safeList(offersCollection(), { context: "listAllOffers" });
  return sortRecords(records);
}

/** Live offers pointing at one target, e.g. a doctor or a service. */
export async function listOffersForTarget(
  appliesTo: Offer["appliesTo"],
  targetId: string,
): Promise<Offer[]> {
  const offers = await listLiveOffers();
  return offers.filter(
    (offer) =>
      offer.appliesTo === appliesTo &&
      (offer.targetIds.length === 0 || offer.targetIds.includes(targetId)),
  );
}

/* -------------------------------------------------------------------------- */
/*  Testimonials (spec BQ — only published, clinic-verified entries)            */
/* -------------------------------------------------------------------------- */

export async function listPublishedTestimonials(): Promise<Testimonial[]> {
  const collectionRef = testimonialsCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("published", "==", true)) : null,
    { context: "listPublishedTestimonials" },
  );
  return sortRecords(records);
}

/* -------------------------------------------------------------------------- */
/*  Public cache groups                                                        */
/* -------------------------------------------------------------------------- */

export interface PublicCatalogDataset {
  services: Service[];
  categories: ServiceCategory[];
  specialties: Specialty[];
}

/**
 * Services, their categories and the specialties, in one cached payload.
 *
 * `/services`, every service detail page, `/aesthetics`, `/specialties`, each
 * specialty page and the homepage all draw from this one entry, so whichever of
 * them a visitor lands on first warms the data for the rest.
 */
export const getPublicCatalogDataset = cache(
  async (): Promise<PublicCatalogDataset> =>
    readPublicCacheGroup("catalog", async () => {
      const [services, categories, specialties] = await Promise.all([
        listPublicServices(),
        listServiceCategories(),
        listPublicSpecialties(),
      ]);
      return { services, categories, specialties };
    }),
);

export interface PublicPromotionsDataset {
  offers: Offer[];
  testimonials: Testimonial[];
}

/**
 * Live offers and published testimonials.
 *
 * Kept apart from the catalogue because offers are date-windowed: a shorter
 * lived dataset should not force the whole catalogue to be re-read, and vice
 * versa. `isOfferLive()` is re-evaluated against today's date *after* the cache
 * read, so an offer that expires inside the TTL still disappears on time.
 */
export const getPublicPromotionsDataset = cache(
  async (): Promise<PublicPromotionsDataset> =>
    readPublicCacheGroup("promotions", async () => {
      const [offers, testimonials] = await Promise.all([
        listLiveOffers(),
        listPublishedTestimonials(),
      ]);
      return { offers, testimonials };
    }),
);

/** Live offers for the public site, re-checked against today's date. */
export async function getPublicLiveOffers(): Promise<Offer[]> {
  const { offers } = await getPublicPromotionsDataset();
  const today = clinicToday();
  return offers.filter((offer) => isOfferLive(offer, today));
}

export async function getPublicHomepageOffers(): Promise<Offer[]> {
  const offers = await getPublicLiveOffers();
  return offers.filter((offer) => offer.showOnHome);
}

export async function getPublicTestimonials(): Promise<Testimonial[]> {
  const { testimonials } = await getPublicPromotionsDataset();
  return testimonials;
}
