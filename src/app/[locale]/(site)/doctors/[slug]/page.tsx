import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DoctorBookingActions } from "@/components/public/booking-actions";
import { DoctorCard } from "@/components/public/doctor-card";
import { EntityImage } from "@/components/public/entity-image";
import { PriceList, UnpricedServiceList } from "@/components/public/price-list";
import { WeeklySchedule } from "@/components/public/schedule-view";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { createPageMetadata } from "@/lib/seo";
import { doctorSchema } from "@/lib/structured-data";
import { getPublicDoctorsDataset } from "@/services/doctors";
import { getDoctorListing, getDoctorsDirectory } from "@/services/public-content";
import { getSiteSettings } from "@/services/settings";
import { localizedText } from "@/types/common";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

/**
 * Prerender every known doctor at build time. `dynamicParams` stays at its
 * default (`true`), so a doctor added from the dashboard after a deploy is
 * server-rendered on first request instead of 404-ing.
 */
export async function generateStaticParams() {
  const { doctors } = await getPublicDoctorsDataset();
  return routing.locales.flatMap((locale) =>
    doctors.map((doctor) => ({ locale, slug: doctor.slug })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const [listing, settings] = await Promise.all([
    getDoctorListing(slug),
    getSiteSettings(),
  ]);

  if (!listing) {
    const t = await getTranslations({ locale, namespace: "pages.doctorProfile" });
    return createPageMetadata({
      locale,
      pathname: `/doctors/${slug}`,
      title: t("title"),
      description: t("subtitle"),
      noIndex: true,
    });
  }

  const { doctor } = listing;
  const name = localizedText(doctor.nameAr, doctor.nameEn, locale) ?? slug;
  const title = localizedText(doctor.seoTitleAr, doctor.seoTitleEn, locale) ?? name;
  const description =
    localizedText(doctor.seoDescriptionAr, doctor.seoDescriptionEn, locale) ??
    localizedText(doctor.titleAr, doctor.titleEn, locale) ??
    localizedText(doctor.bioAr, doctor.bioEn, locale) ??
    name;

  return createPageMetadata({
    locale,
    pathname: `/doctors/${slug}`,
    title,
    description,
    imageUrl: doctor.imageUrl ?? settings.seo.ogImageUrl,
  });
}

export default async function DoctorProfilePage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const listing = await getDoctorListing(slug);
  if (!listing) notFound();

  const { doctor, specialties, schedules, prices, unpricedServices, onlineBookingAvailable } =
    listing;

  const tn = await getTranslations("nav");
  const t = await getTranslations("doctor");

  const name = localizedText(doctor.nameAr, doctor.nameEn, locale) ?? slug;
  const title = localizedText(doctor.titleAr, doctor.titleEn, locale);
  const bio = localizedText(doctor.bioAr, doctor.bioEn, locale);
  const qualifications = locale === "ar" ? doctor.qualificationsAr : doctor.qualificationsEn;

  const { listings } = await getDoctorsDirectory();
  const related = listings
    .filter(
      (other) =>
        other.doctor.id !== doctor.id &&
        other.doctor.specialtyIds.some((id) => doctor.specialtyIds.includes(id)),
    )
    .slice(0, 3);

  return (
    <>
      <JsonLd data={doctorSchema(doctor, specialties, locale)} />

      <PageHeader
        title={name}
        subtitle={title ?? undefined}
        crumbs={[
          { label: tn("home"), href: "/" },
          { label: tn("doctors"), href: "/doctors" },
          { label: name },
        ]}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          {/* ── Identity column ────────────────────────────────────────── */}
          <div className="space-y-5">
            <EntityImage
              src={doctor.imageUrl}
              alt={name}
              name={name}
              priority
              sizes="(max-width: 1024px) 80vw, 340px"
              className="mx-auto aspect-4/5 w-full max-w-80 rounded-[1.75rem] shadow-card ring-1 ring-ink-200"
            />

            {specialties.length > 0 ? (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-ink-700">
                  {t("specialties")}
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

            <DoctorBookingActions
              doctorSlug={doctor.slug}
              doctorName={name}
              onlineBookingAvailable={onlineBookingAvailable}
            />

            {!onlineBookingAvailable ? (
              <div className="rounded-card border border-ink-200/70 bg-surface-muted p-4">
                <p className="text-sm font-semibold text-ink-800">
                  {t("bookingSoonTitle")}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t("bookingSoonDescription")}
                </p>
              </div>
            ) : null}
          </div>

          {/* ── Detail column ──────────────────────────────────────────── */}
          <div className="space-y-10">
            {bio ? (
              <p className="text-base leading-relaxed text-ink-700">{bio}</p>
            ) : null}

            {qualifications.length > 0 ? (
              <div>
                <h2 className="mb-3 text-lg font-bold text-ink-900">
                  {t("qualifications")}
                </h2>
                <ul className="space-y-2">
                  {qualifications.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-700"
                    >
                      <GraduationCap
                        className="mt-0.5 size-4 shrink-0 text-teal-600"
                        aria-hidden
                      />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div>
              <h2 className="mb-3 text-lg font-bold text-ink-900">{t("schedule")}</h2>
              <WeeklySchedule schedules={schedules} />
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-ink-900">{t("prices")}</h2>
              {prices.length > 0 ? <PriceList prices={prices} /> : null}
              {unpricedServices.length > 0 ? (
                <div className={prices.length > 0 ? "mt-5" : undefined}>
                  <h3 className="mb-2 text-sm font-semibold text-ink-700">
                    {t("services")}
                  </h3>
                  <UnpricedServiceList prices={unpricedServices} />
                </div>
              ) : null}
              {prices.length === 0 && unpricedServices.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noPrices")}</p>
              ) : null}
            </div>
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section tone="muted">
          <SectionHeading
            title={t("otherDoctors")}
            action={<ButtonLink href="/doctors" variant="outline">{tn("doctors")}</ButtonLink>}
          />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((entry) => (
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
