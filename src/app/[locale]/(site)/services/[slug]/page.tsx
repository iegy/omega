import { CalendarCheck } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ServiceCard } from "@/components/public/catalog-cards";
import { DoctorCard } from "@/components/public/doctor-card";
import { EntityImage } from "@/components/public/entity-image";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { formatPrice } from "@/lib/clinic-format";
import { createPageMetadata } from "@/lib/seo";
import { getPublicCatalogDataset } from "@/services/catalog";
import { getDoctorsDirectory, getServiceListing } from "@/services/public-content";
import { getSiteSettings } from "@/services/settings";
import { localizedText } from "@/types/common";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateStaticParams() {
  const { services } = await getPublicCatalogDataset();
  return routing.locales.flatMap((locale) =>
    services.map((service) => ({ locale, slug: service.slug })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const [listing, settings] = await Promise.all([
    getServiceListing(slug),
    getSiteSettings(),
  ]);

  if (!listing) {
    const t = await getTranslations({ locale, namespace: "pages.serviceProfile" });
    return createPageMetadata({
      locale,
      pathname: `/services/${slug}`,
      title: t("title"),
      description: t("subtitle"),
      noIndex: true,
    });
  }

  const { service, category } = listing;
  const name = localizedText(service.nameAr, service.nameEn, locale) ?? slug;
  const categoryName = category
    ? localizedText(category.nameAr, category.nameEn, locale)
    : null;
  const clinicName = localizedText(
    settings.branding.clinicName.ar,
    settings.branding.clinicName.en,
    locale,
  );

  return createPageMetadata({
    locale,
    pathname: `/services/${slug}`,
    title: localizedText(service.seoTitleAr, service.seoTitleEn, locale) ?? name,
    description:
      localizedText(service.seoDescriptionAr, service.seoDescriptionEn, locale) ??
      localizedText(service.descriptionAr, service.descriptionEn, locale) ??
      // No invented clinical description: just the service, its category and
      // where it is offered — all three are stored facts.
      [name, categoryName, clinicName].filter(Boolean).join(" — "),
    imageUrl: service.imageUrl ?? settings.seo.ogImageUrl,
  });
}

export default async function ServiceProfilePage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const listing = await getServiceListing(slug);
  if (!listing) notFound();

  const { service, category, doctors, specialties, doctorPrices, related } = listing;

  const tn = await getTranslations("nav");
  const t = await getTranslations("servicePage");
  const tp = await getTranslations("price");

  const name = localizedText(service.nameAr, service.nameEn, locale) ?? slug;
  const description = localizedText(
    service.descriptionAr,
    service.descriptionEn,
    locale,
  );
  const categoryName = category
    ? localizedText(category.nameAr, category.nameEn, locale)
    : null;
  const cataloguePrice = service.showPrice ? formatPrice(service.price, locale) : null;

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
          { label: tn("services"), href: "/services" },
          { label: name },
        ]}
        actions={
          <ButtonLink href="/services" variant="outline">
            {t("allServices")}
          </ButtonLink>
        }
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {categoryName && category ? (
                <Link href={`/services#${category.slug}`}>
                  <Badge tone="teal">{categoryName}</Badge>
                </Link>
              ) : null}
              {service.requiresBooking ? (
                <Badge tone="neutral">
                  <CalendarCheck className="size-3" aria-hidden />
                  {t("requiresBooking")}
                </Badge>
              ) : null}
              {cataloguePrice ? (
                <Badge tone="positive">{cataloguePrice}</Badge>
              ) : null}
            </div>

            {specialties.length > 0 ? (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-ink-700">
                  {t("specialtiesTitle")}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {specialties.map((specialty) => (
                    <li key={specialty.id}>
                      <Link href={`/specialties/${specialty.slug}`}>
                        <Badge tone="brand">
                          {localizedText(specialty.nameAr, specialty.nameEn, locale)}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Doctor-specific fees. A doctor's fee is never generalised to the
                catalogue, and the catalogue price is never attributed to a
                doctor — they are separate figures in the clinic's own data. */}
            {doctorPrices.length > 0 ? (
              <div>
                <h2 className="mb-3 text-lg font-bold text-ink-900">
                  {t("pricesTitle")}
                </h2>
                <ul className="divide-y divide-ink-200/70 overflow-hidden rounded-card border border-ink-200/70 bg-surface">
                  {doctorPrices.map(({ doctor, price }) => (
                    <li
                      key={`${doctor.id}-${price.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 p-4"
                    >
                      <Link
                        href={`/doctors/${doctor.slug}`}
                        className="font-medium text-ink-800 hover:text-teal-700 hover:underline"
                      >
                        {localizedText(doctor.nameAr, doctor.nameEn, locale)}
                      </Link>
                      <span className="font-bold text-teal-700 tabular-nums">
                        {formatPrice(price.price, locale) ?? tp("onRequest")}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-muted-foreground">{t("pricesNote")}</p>
              </div>
            ) : null}
          </div>

          {service.imageUrl ? (
            <EntityImage
              src={service.imageUrl}
              alt={name}
              name={name}
              sizes="(max-width: 1024px) 90vw, 340px"
              className="aspect-4/3 w-full rounded-card ring-1 ring-ink-200"
            />
          ) : null}
        </div>
      </Section>

      <Section tone="muted">
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

      {related.length > 0 ? (
        <Section>
          <SectionHeading title={t("relatedTitle")} />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((entry) => (
              <li key={entry.id}>
                <ServiceCard service={entry} category={category} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
