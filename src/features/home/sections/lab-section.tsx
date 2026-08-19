import { ArrowLeft, Truck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { EntityImage } from "@/components/public/entity-image";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/ui/section";
import type { Locale } from "@/i18n/routing";
import { getPublicLabDataset } from "@/services/lab";
import { getSiteSettings } from "@/services/settings";
import { localizedText } from "@/types/common";

/**
 * Mawoda Atef Lab teaser, driven by `siteContent/labProfile` and `labUnits`.
 * Falls back to the translated copy only when the profile document is missing.
 */
export async function LabSection() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("home.lab");
  const tl = await getTranslations("labPage");
  const tcta = await getTranslations("cta");

  const [{ profile, units }, settings] = await Promise.all([
    getPublicLabDataset(),
    getSiteSettings(),
  ]);

  const name =
    (profile ? localizedText(profile.nameAr, profile.nameEn, locale) : null) ??
    t("title");
  const description =
    (profile ? localizedText(profile.descriptionAr, profile.descriptionEn, locale) : null) ??
    t("subtitle");

  return (
    <Section tone="default">
      <div className="grid items-center gap-10 rounded-[2rem] border border-brand-100 bg-brand-50/40 p-6 sm:p-10 lg:grid-cols-[0.85fr_1.15fr]">
        <EntityImage
          src={profile?.logoUrl ?? settings.branding.labLogoUrl}
          alt={name}
          name={name}
          objectFit="contain"
          sizes="(max-width: 1024px) 70vw, 320px"
          className="mx-auto aspect-square w-full max-w-xs rounded-3xl bg-white shadow-soft"
        />

        <div>
          <SectionHeading title={name} subtitle={description} />

          {units.length > 0 ? (
            <ul className="mb-6 flex flex-wrap gap-2">
              {units.map((unit) => (
                <li key={unit.id}>
                  <Badge tone="brand">
                    {localizedText(unit.nameAr, unit.nameEn, locale)}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/labs">{tcta("visitLab")}</ButtonLink>
            {profile?.sampleCollectionEnabled !== false ? (
              <ButtonLink href="/labs#sample-collection" variant="outline">
                <Truck className="size-4" aria-hidden />
                {tcta("requestSample")}
                <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
              </ButtonLink>
            ) : null}
          </div>

          <p className="sr-only">{tl("sampleDescription")}</p>
        </div>
      </div>
    </Section>
  );
}
