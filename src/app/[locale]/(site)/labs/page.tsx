import { Building2, Clock, Home, Hospital, Phone, Truck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LabUnitCard } from "@/components/public/catalog-cards";
import { EntityImage } from "@/components/public/entity-image";
import { Badge } from "@/components/ui/badge";
import { ExternalButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import type { Locale } from "@/i18n/routing";
import { telHref, whatsappHref } from "@/lib/contact";
import { createPageMetadata } from "@/lib/seo";
import { getPublicLabDataset } from "@/services/lab";
import { getSiteSettings } from "@/services/settings";
import { localizedText } from "@/types/common";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const [{ profile }, settings] = await Promise.all([
    getPublicLabDataset(),
    getSiteSettings(),
  ]);

  if (!profile) {
    const t = await getTranslations({ locale, namespace: "pages.labs" });
    return createPageMetadata({
      locale,
      pathname: "/labs",
      title: t("title"),
      description: t("subtitle"),
      imageUrl: settings.seo.ogImageUrl,
    });
  }

  const name = localizedText(profile.nameAr, profile.nameEn, locale) ?? "";

  return createPageMetadata({
    locale,
    pathname: "/labs",
    title: localizedText(profile.seoTitleAr, profile.seoTitleEn, locale) ?? name,
    description:
      localizedText(profile.seoDescriptionAr, profile.seoDescriptionEn, locale) ??
      localizedText(profile.descriptionAr, profile.descriptionEn, locale) ??
      name,
    imageUrl: profile.logoUrl ?? settings.seo.ogImageUrl,
  });
}

/**
 * Mawoda Atef Lab — معامل مودة عاطف.
 *
 * Everything on this page comes from `siteContent/labProfile` and `labUnits`.
 * Two honesty constraints from the clinic's data are visible in the markup:
 *
 * - `openingHoursAr/En` are `null`. The page says the hours are not published
 *   and gives the phone numbers, rather than printing plausible hours.
 * - Online sample requests write to Firestore, which is not open to anonymous
 *   visitors yet (that is a security gate). The section advertises the real
 *   service and routes the patient to the real phone numbers.
 */
export default async function LabsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tn = await getTranslations("nav");
  const tp = await getTranslations("pages.labs");
  const t = await getTranslations("labPage");
  const tc = await getTranslations("common");
  const ts = await getTranslations("states.empty");

  const [{ profile, units }, settings] = await Promise.all([
    getPublicLabDataset(),
    getSiteSettings(),
  ]);

  const name = profile
    ? (localizedText(profile.nameAr, profile.nameEn, locale) ?? tp("title"))
    : tp("title");
  const description = profile
    ? localizedText(profile.descriptionAr, profile.descriptionEn, locale)
    : null;
  const openingHours = profile
    ? localizedText(profile.openingHoursAr, profile.openingHoursEn, locale)
    : null;
  const sampleNote = profile
    ? localizedText(
        profile.sampleCollectionNoteAr,
        profile.sampleCollectionNoteEn,
        locale,
      )
    : null;

  const phones = profile?.phones ?? settings.contact.labPhones;
  const labWhatsapp = whatsappHref(profile?.whatsapp ?? null, name);

  const locations = [
    { key: "sampleHome", icon: Home },
    { key: "sampleHospital", icon: Hospital },
    { key: "sampleClinic", icon: Building2 },
  ] as const;

  return (
    <>
      <PageHeader
        title={name}
        subtitle={description ?? tp("subtitle")}
        tone="brand"
        crumbs={[{ label: tn("home"), href: "/" }, { label: tn("labs") }]}
      />

      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <EntityImage
            src={profile?.logoUrl ?? settings.branding.labLogoUrl}
            alt={name}
            name={name}
            priority
            objectFit="contain"
            sizes="(max-width: 1024px) 70vw, 320px"
            className="mx-auto aspect-square w-full max-w-xs rounded-3xl bg-white shadow-soft ring-1 ring-ink-200/70"
          />

          <div className="space-y-6">
            {units.length > 0 ? (
              <Badge tone="brand">{t("unitsCountMany", { count: units.length })}</Badge>
            ) : null}

            <div>
              <h2 className="mb-3 text-lg font-bold text-ink-900">
                {t("contactTitle")}
              </h2>
              {phones.length > 0 ? (
                <ul className="flex flex-wrap gap-3">
                  {phones.map((phone) => {
                    const href = telHref(phone);
                    return (
                      <li key={phone}>
                        {href ? (
                          <ExternalButtonLink href={href} variant="outline">
                            <Phone className="size-4" aria-hidden />
                            <span dir="ltr">{phone}</span>
                          </ExternalButtonLink>
                        ) : null}
                      </li>
                    );
                  })}
                  {labWhatsapp ? (
                    <li>
                      <ExternalButtonLink
                        href={labWhatsapp}
                        variant="outline"
                        target="_blank"
                      >
                        {tc("whatsapp")}
                      </ExternalButtonLink>
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{tc("notAvailable")}</p>
              )}
            </div>

            <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              <Clock className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />
              {openingHours ?? t("hoursUnknown")}
            </p>
          </div>
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading title={t("unitsTitle")} />
        {units.length === 0 ? (
          <EmptyState title={ts("title")} description={ts("description")} />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <li key={unit.id}>
                <LabUnitCard unit={unit} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="sample-collection">
        <div className="rounded-[2rem] border border-brand-100 bg-brand-50/40 p-6 sm:p-10">
          <span className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-soft">
            <Truck className="size-5.5" aria-hidden />
          </span>

          <SectionHeading
            title={t("sampleTitle")}
            subtitle={sampleNote ?? t("sampleDescription")}
          />

          <ul className="grid gap-3 sm:grid-cols-3">
            {locations.map(({ key, icon: Icon }) => (
              <li
                key={key}
                className="flex items-center gap-3 rounded-card border border-ink-200/70 bg-surface p-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <span className="font-semibold text-ink-800">{t(key)}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            {t("samplePending")}
          </p>

          {phones.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {phones.map((phone) => {
                const href = telHref(phone);
                return href ? (
                  <ExternalButtonLink key={phone} href={href} variant="primary">
                    <Phone className="size-4" aria-hidden />
                    <span dir="ltr">{phone}</span>
                  </ExternalButtonLink>
                ) : null;
              })}
            </div>
          ) : null}
        </div>
      </Section>
    </>
  );
}
