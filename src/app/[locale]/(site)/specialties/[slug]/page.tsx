import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ServiceCard } from "@/components/public/catalog-cards";
import { DoctorCard } from "@/components/public/doctor-card";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import { routing, type Locale } from "@/i18n/routing";
import { createPageMetadata } from "@/lib/seo";
import { getPublicCatalogDataset } from "@/services/catalog";
import { getDoctorsDirectory, getSpecialtyListing } from "@/services/public-content";
import { getSiteSettings } from "@/services/settings";
import { localizedText } from "@/types/common";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateStaticParams() {
  const { specialties } = await getPublicCatalogDataset();
  return routing.locales.flatMap((locale) =>
    specialties.map((specialty) => ({ locale, slug: specialty.slug })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const [listing, settings] = await Promise.all([
    getSpecialtyListing(slug),
    getSiteSettings(),
  ]);

  if (!listing) {
    const t = await getTranslations({ locale, namespace: "pages.specialtyProfile" });
    return createPageMetadata({
      locale,
      pathname: `/specialties/${slug}`,
      title: t("title"),
      description: t("subtitle"),
      noIndex: true,
    });
  }

  const { specialty } = listing;
  const name = localizedText(specialty.nameAr, specialty.nameEn, locale) ?? slug;
  const clinicName = localizedText(
    settings.branding.clinicName.ar,
    settings.branding.clinicName.en,
    locale,
  );

  return createPageMetadata({
    locale,
    pathname: `/specialties/${slug}`,
    title: localizedText(specialty.seoTitleAr, specialty.seoTitleEn, locale) ?? name,
    description:
      localizedText(specialty.seoDescriptionAr, specialty.seoDescriptionEn, locale) ??
      localizedText(specialty.descriptionAr, specialty.descriptionEn, locale) ??
      // The clinic supplied specialty names only. Rather than invent a medical
      // description, the fallback states a plain, verifiable fact.
      [name, clinicName].filter(Boolean).join(" — "),
    imageUrl: specialty.imageUrl ?? settings.seo.ogImageUrl,
  });
}

export default async function SpecialtyProfilePage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const listing = await getSpecialtyListing(slug);
  if (!listing) notFound();

  const { specialty, doctors, services } = listing;

  const tn = await getTranslations("nav");
  const t = await getTranslations("specialtyPage");

  const name = localizedText(specialty.nameAr, specialty.nameEn, locale) ?? slug;
  const description = localizedText(
    specialty.descriptionAr,
    specialty.descriptionEn,
    locale,
  );

  // Reuse the joined directory so each doctor card gets its schedules and price.
  const { listings } = await getDoctorsDirectory();
  const doctorIds = new Set(doctors.map((doctor) => doctor.id));
  const doctorListings = listings.filter((entry) => doctorIds.has(entry.doctor.id));

  return (
    <>
      <PageHeader
        title={name}
        subtitle={description ?? undefined}
        crumbs={[
          { label: tn("home"), href: "/" },
          { label: tn("specialties"), href: "/specialties" },
          { label: name },
        ]}
        actions={
          <ButtonLink href="/specialties" variant="outline">
            {t("browseAll")}
          </ButtonLink>
        }
      />

      <Section>
        <SectionHeading title={t("doctorsTitle")} />
        {doctorListings.length === 0 ? (
          <EmptyState title={t("noDoctors")} />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {doctorListings.map((entry) => (
              <li key={entry.doctor.id}>
                <DoctorCard listing={entry} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {services.length > 0 ? (
        <Section tone="muted">
          <SectionHeading title={t("servicesTitle")} />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li key={service.id}>
                <ServiceCard service={service} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
