import { getLocale } from "next-intl/server";

import { ServiceCard, SpecialtyCard } from "@/components/public/catalog-cards";
import { OfferCard } from "@/components/public/offer-card";
import { HomeCollectionSection } from "@/features/home/sections/collection-section";
import { getPublicHomepageOffers, getPublicTestimonials } from "@/services/catalog";
import { getServicesCatalogue, getSpecialtiesDirectory } from "@/services/public-content";
import { localizedText } from "@/types/common";
import type { Locale } from "@/i18n/routing";

/**
 * Homepage blocks over the catalogue collections.
 *
 * Each one prefers the records the clinic has explicitly flagged (`featured`,
 * `showOnHome`) and falls back to the first few by `sortOrder`, so the homepage
 * is never empty just because nobody has set a flag yet — while still respecting
 * the flag when it is set.
 */

export async function SpecialtiesHomeSection() {
  const directory = await getSpecialtiesDirectory();
  const featured = directory.filter((entry) => entry.specialty.featured);
  const shown = (featured.length > 0 ? featured : directory).slice(0, 8);

  return (
    <HomeCollectionSection
      namespace="specialties"
      emptyKey="specialtiesEmpty"
      viewAllHref="/specialties"
      tone="muted"
      isEmpty={directory.length === 0}
    >
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map(({ specialty, doctors }) => (
          <li key={specialty.id}>
            <SpecialtyCard specialty={specialty} doctorCount={doctors.length} />
          </li>
        ))}
      </ul>
    </HomeCollectionSection>
  );
}

export async function ServicesHomeSection() {
  const { services, groups } = await getServicesCatalogue();
  const categoryById = new Map(groups.map((group) => [group.category.id, group.category]));

  const featured = services.filter((service) => service.featured);
  const shown = (featured.length > 0 ? featured : services).slice(0, 6);

  return (
    <HomeCollectionSection
      namespace="services"
      emptyKey="servicesEmpty"
      viewAllHref="/services"
      tone="muted"
      isEmpty={services.length === 0}
    >
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((service) => (
          <li key={service.id}>
            <ServiceCard
              service={service}
              category={
                service.categoryId ? categoryById.get(service.categoryId) : undefined
              }
            />
          </li>
        ))}
      </ul>
    </HomeCollectionSection>
  );
}

/**
 * Live offers flagged `showOnHome`. The clinic has none confirmed, so this
 * renders its factual empty line — never an invented promotion.
 */
export async function OffersHomeSection() {
  const offers = await getPublicHomepageOffers();

  return (
    <HomeCollectionSection
      namespace="offers"
      emptyKey="offersEmpty"
      viewAllHref="/offers"
      isEmpty={offers.length === 0}
    >
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {offers.slice(0, 3).map((offer) => (
          <li key={offer.id}>
            <OfferCard offer={offer} />
          </li>
        ))}
      </ul>
    </HomeCollectionSection>
  );
}

/**
 * Only published, clinic-verified testimonials are ever rendered (spec BQ).
 * The section is disabled in `homepageSections` because no real review exists;
 * this component exists so enabling it from the dashboard just works.
 */
export async function TestimonialsHomeSection() {
  const locale = (await getLocale()) as Locale;
  const testimonials = await getPublicTestimonials();

  return (
    <HomeCollectionSection
      namespace="testimonials"
      emptyKey="testimonialsEmpty"
      tone="muted"
      isEmpty={testimonials.length === 0}
    >
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.slice(0, 6).map((testimonial) => (
          <li
            key={testimonial.id}
            className="rounded-card border border-ink-200/70 bg-surface p-5 shadow-soft"
          >
            <blockquote className="text-sm leading-relaxed text-ink-700">
              {localizedText(testimonial.bodyAr, testimonial.bodyEn, locale)}
            </blockquote>
            {testimonial.patientName ? (
              <p className="mt-3 text-sm font-semibold text-ink-800">
                {testimonial.patientName}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </HomeCollectionSection>
  );
}
