import { MapPin, Navigation, Phone } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { ExternalButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Section, SectionHeading } from "@/components/ui/section";
import type { Locale } from "@/i18n/routing";
import {
  directionsHref,
  mapsEmbedSrc,
  mapsViewHref,
  telHref,
} from "@/lib/contact";
import { getSiteSettings } from "@/services/settings";
import { pickLocale } from "@/types/site";

export async function LocationSection() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("home.location");
  const tc = await getTranslations("common");
  const tcta = await getTranslations("cta");
  const settings = await getSiteSettings();
  const { location, contact } = settings;

  const embed = mapsEmbedSrc(location.latitude, location.longitude);
  const view = mapsViewHref(location.latitude, location.longitude, location.mapsUrl);
  const directions = directionsHref(
    location.latitude,
    location.longitude,
    location.directionsUrl,
  );
  const phoneLink = telHref(contact.phone);

  return (
    <Section tone="default">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden p-0">
          {embed ? (
            <iframe
              title={t("title")}
              src={embed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-72 w-full border-0 sm:h-96"
            />
          ) : (
            <div className="flex h-72 items-center justify-center bg-surface-muted text-sm text-muted-foreground sm:h-96">
              {tc("notAvailable")}
            </div>
          )}
        </Card>

        <Card>
          <CardBody className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <MapPin className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-800">{tc("address")}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {pickLocale(location.address, locale)}
                </p>
              </div>
            </div>

            {phoneLink ? (
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <Phone className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-800">{tc("phone")}</p>
                  <a
                    href={phoneLink}
                    dir="ltr"
                    className="mt-1 block text-sm text-teal-700 hover:underline"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-1">
              {view ? (
                <ExternalButtonLink href={view} target="_blank" variant="outline">
                  <MapPin className="size-4" aria-hidden />
                  {tcta("viewMap")}
                </ExternalButtonLink>
              ) : null}
              {directions ? (
                <ExternalButtonLink href={directions} target="_blank">
                  <Navigation className="size-4" aria-hidden />
                  {tcta("getDirections")}
                </ExternalButtonLink>
              ) : null}
            </div>
          </CardBody>
        </Card>
      </div>
    </Section>
  );
}
