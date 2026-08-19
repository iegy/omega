import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ServiceCard } from "@/components/public/catalog-cards";
import { DoctorCard } from "@/components/public/doctor-card";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import type { Locale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getAestheticsCatalogue, getDoctorsDirectory } from "@/services/public-content";
import { localizedText } from "@/types/common";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pathname: "/aesthetics",
    namespace: "aesthetics",
  });
}

/**
 * Aesthetics & laser, built from the real `category-aesthetics` services.
 *
 * Nothing is added to or renamed in that list. In particular the wart-removal
 * entry is stored as "إزالة السنط بجهاز مجاليف" — «مجاليف» is the device name
 * the clinic uses, not a typo, and it must never be auto-corrected. Prices are
 * `null` throughout because the clinic has not published them.
 */
export default async function AestheticsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tn = await getTranslations("nav");
  const tp = await getTranslations("pages.aesthetics");
  const t = await getTranslations("servicePage");
  const ts = await getTranslations("states.empty");

  const [group, { listings }] = await Promise.all([
    getAestheticsCatalogue(),
    getDoctorsDirectory(),
  ]);

  const services = group?.services ?? [];
  const categoryName = group
    ? localizedText(group.category.nameAr, group.category.nameEn, locale)
    : null;

  // Doctors linked to any aesthetics service, or holding the aesthetics specialty.
  const serviceDoctorIds = new Set(services.flatMap((service) => service.doctorIds));
  const doctorListings = listings.filter(
    (entry) =>
      serviceDoctorIds.has(entry.doctor.id) ||
      entry.specialties.some((specialty) => specialty.slug === "aesthetics-laser"),
  );

  const countLabel =
    services.length === 1
      ? t("servicesCountOne")
      : services.length === 2
        ? t("servicesCountTwo")
        : t("servicesCountMany", { count: services.length });

  return (
    <>
      <PageHeader
        title={tp("title")}
        subtitle={tp("subtitle")}
        tone="brand"
        crumbs={[{ label: tn("home"), href: "/" }, { label: tn("aesthetics") }]}
      />

      <Section>
        <SectionHeading
          eyebrow={services.length > 0 ? countLabel : undefined}
          title={categoryName ?? tp("title")}
        />

        {services.length === 0 ? (
          <EmptyState
            title={ts("title")}
            description={ts("description")}
            icon={<Sparkles className="size-5" aria-hidden />}
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li key={service.id}>
                <ServiceCard service={service} category={group?.category} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {doctorListings.length > 0 ? (
        <Section tone="muted">
          <SectionHeading title={t("doctorsTitle")} />
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {doctorListings.map((entry) => (
              <li key={entry.doctor.id}>
                <DoctorCard listing={entry} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
