import { SITE_URL } from "@/config/constants";
import type { Locale } from "@/i18n/routing";
import { pickLocale, type SiteSettings } from "@/types/site";

/** `MedicalClinic` + `LocalBusiness` graph for the homepage (spec BV). */
export function medicalClinicSchema(
  settings: SiteSettings,
  locale: Locale,
): Record<string, unknown> {
  const { branding, contact, location, social, seo } = settings;

  const sameAs = [social.facebook, social.tiktok, social.instagram, social.youtube]
    .filter((value): value is string => Boolean(value));

  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": `${SITE_URL}/#clinic`,
    name: pickLocale(branding.clinicName, locale),
    description: pickLocale(seo.description, locale),
    url: SITE_URL,
    image: seo.ogImageUrl ? `${SITE_URL}${seo.ogImageUrl}` : undefined,
    logo: branding.logoUrl ? `${SITE_URL}${branding.logoUrl}` : undefined,
    telephone: contact.phone ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: pickLocale(location.address, locale),
      addressLocality: locale === "ar" ? "رشيد" : "Rashid",
      addressCountry: "EG",
    },
    geo:
      location.latitude !== null && location.longitude !== null
        ? {
            "@type": "GeoCoordinates",
            latitude: location.latitude,
            longitude: location.longitude,
          }
        : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}

/**
 * `Physician` for a doctor profile (spec BV).
 *
 * Only stored facts are emitted. No rating, no review count, no years of
 * experience, no certification claim — none of that exists in Firestore, and
 * fabricating it in structured data would be a medical claim search engines
 * would surface as fact.
 */
export function doctorSchema(
  doctor: {
    slug: string;
    nameAr: string;
    nameEn: string;
    titleAr: string | null;
    titleEn: string | null;
    bioAr: string | null;
    bioEn: string | null;
    imageUrl: string | null;
  },
  specialties: { nameAr: string; nameEn: string }[],
  locale: Locale,
): Record<string, unknown> {
  const name = locale === "ar" ? doctor.nameAr : doctor.nameEn;
  const jobTitle = locale === "ar" ? doctor.titleAr : doctor.titleEn;
  const description = locale === "ar" ? doctor.bioAr : doctor.bioEn;
  const path = locale === "ar" ? `/doctors/${doctor.slug}` : `/en/doctors/${doctor.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    "@id": `${SITE_URL}${path}#physician`,
    name,
    url: `${SITE_URL}${path}`,
    jobTitle: jobTitle ?? undefined,
    description: description ?? jobTitle ?? undefined,
    image: doctor.imageUrl ?? undefined,
    medicalSpecialty:
      specialties.length > 0
        ? specialties.map((specialty) =>
            locale === "ar" ? specialty.nameAr : specialty.nameEn,
          )
        : undefined,
    worksFor: { "@id": `${SITE_URL}/#clinic` },
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}
